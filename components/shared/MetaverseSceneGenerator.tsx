import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import AISceneDirector from './AISceneDirector';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Music, MapPin, User, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// --- CONSTANTS & PALETTES ---

const SKIN_TONES = [
    0xf5c3a6, // Type I
    0xffdbac, // Type II
    0xe0ac69, // Type III
    0xc68642, // Type IV
    0x8d5524, // Type V
    0x3c2103  // Type VI
];

const CLOTHES_TONES = [
    0x0a0a0a, 0x1a1a1a, 0x2a2a2a, // Deep Darks
    0x1e3a8a, 0x2563eb, // Electric Blues
    0xb91c1c, 0xdc2626, // Stage Reds
    0xffffff, 0xf3f4f6, // Crisp Whites
    0x7c3aed, 0xa855f7, // Vivid Purples
    0xfacc15, // Cyber Yellows
];

// --- GEOMETRY HELPERS ---

const mergeGeometries = (geometries: THREE.BufferGeometry[]) => {
    let vertexCount = 0;
    let indexCount = 0;

    geometries.forEach(g => {
        vertexCount += g.attributes.position.count;
        if (g.index) indexCount += g.index.count;
    });

    const mergedGeometry = new THREE.BufferGeometry();
    const positionArray = new Float32Array(vertexCount * 3);
    const normalArray = new Float32Array(vertexCount * 3);
    const indexArray = new Uint32Array(indexCount);

    let vertexOffset = 0;
    let indexOffset = 0;

    geometries.forEach(g => {
        const pos = g.attributes.position;
        const norm = g.attributes.normal;
        const idx = g.index;

        positionArray.set(pos.array, vertexOffset * 3);
        if (norm) normalArray.set(norm.array, vertexOffset * 3);

        if (idx) {
            for (let i = 0; i < idx.count; i++) {
                indexArray[indexOffset + i] = idx.getX(i) + vertexOffset;
            }
            indexOffset += idx.count;
        }

        vertexOffset += pos.count;
    });

    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normalArray, 3));
    if (indexCount > 0) mergedGeometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

    return mergedGeometry;
};

const createHumanoidBodyGeometry = () => {
    const geometries = [];
    const torso = new THREE.BoxGeometry(0.35, 0.55, 0.22);
    torso.translate(0, 1.15, 0);
    geometries.push(torso);

    const lLeg = new THREE.CylinderGeometry(0.07, 0.06, 0.85, 8);
    lLeg.translate(-0.1, 0.425, 0);
    geometries.push(lLeg);

    const rLeg = new THREE.CylinderGeometry(0.07, 0.06, 0.85, 8);
    rLeg.translate(0.1, 0.425, 0);
    geometries.push(rLeg);

    const lArm = new THREE.CylinderGeometry(0.05, 0.04, 0.7, 8);
    lArm.rotateZ(0.15);
    lArm.translate(-0.28, 1.1, 0);
    geometries.push(lArm);

    const rArm = new THREE.CylinderGeometry(0.05, 0.04, 0.7, 8);
    rArm.rotateZ(-0.15);
    rArm.translate(0.28, 1.1, 0);
    geometries.push(rArm);

    return mergeGeometries(geometries);
};

const createHumanoidSkinGeometry = () => {
    const geometries = [];
    const head = new THREE.SphereGeometry(0.14, 12, 12);
    head.translate(0, 1.55, 0);
    geometries.push(head);

    const lHand = new THREE.SphereGeometry(0.05, 6, 6);
    lHand.translate(-0.33, 0.75, 0);
    geometries.push(lHand);

    const rHand = new THREE.SphereGeometry(0.05, 6, 6);
    rHand.translate(0.33, 0.75, 0);
    geometries.push(rHand);

    return mergeGeometries(geometries);
};

export default function MetaverseSceneGenerator() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [sceneData, setSceneData] = useState({ fps: 60, triangles: 0, crowdSize: 0 });
  const [venue, setVenue] = useState<'ARENA' | 'FESTIVAL'>('ARENA');
  
  // Instance Refs
  const clothesMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const skinMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const lightsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const userDataRef = useRef<any[]>([]);
  
  // Dynamic Elements Refs
  const movingHeadsRef = useRef<any[]>([]);
  const lasersRef = useRef<THREE.Mesh[]>([]);
  const performerRef = useRef<THREE.Group | null>(null);
  const performerSpotRef = useRef<THREE.SpotLight | null>(null);
  const mainScreenRef = useRef<THREE.Mesh | null>(null);

  // ML Stats
  const [mlStats, setMlStats] = useState({ sceneOptimization: 50, accuracy: 0.5 });

  useEffect(() => {
      const handleML = (data:any) => setMlStats(prev => ({...prev, ...data}));
      base44.events.on('ml.update', handleML);
      return () => base44.events.off('ml.update', handleML);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010103);
    scene.fog = new THREE.FogExp2(0x010103, 0.012);

    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / 400, 0.1, 2000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(mountRef.current.clientWidth, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- LIGHTING RIG ---
    // Ambient Fill
    const hemiLight = new THREE.HemisphereLight(0x444488, 0x050505, 0.25);
    scene.add(hemiLight);

    // MOVING HEADS (The "Beam" Lights)
    const createMovingHead = (xPos: number) => {
        const group = new THREE.Group();
        group.position.set(xPos, 14, -28);
        
        // Yoke (Rotates Y)
        const yoke = new THREE.Group();
        group.add(yoke);

        // Head (Rotates X)
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), new THREE.MeshStandardMaterial({color: 0x111111, metalness: 0.8, roughness: 0.2}));
        yoke.add(headMesh);

        const spot = new THREE.SpotLight(0xffffff, 80);
        spot.angle = 0.3;
        spot.penumbra = 0.5;
        spot.decay = 1.5;
        spot.distance = 250;
        spot.castShadow = true;
        yoke.add(spot);
        yoke.add(spot.target);
        spot.target.position.set(0, 0, 10);

        // Volumetric Beam (Fake)
        const beamGeo = new THREE.ConeGeometry(0.6, 80, 32, 1, true);
        beamGeo.translate(0, -40, 0);
        beamGeo.rotateX(-Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        yoke.add(beam);

        scene.add(group);
        return { group, yoke, light: spot, beamMat };
    };

    const heads: any[] = [];
    const headCount = venue === 'ARENA' ? 8 : 14;
    for(let i=0; i<headCount; i++) {
        const x = (i - (headCount-1)/2) * 6;
        heads.push(createMovingHead(x));
    }
    movingHeadsRef.current = heads;

    // --- VENUE GEOMETRY ---
    const stageGeo = new THREE.BoxGeometry(80, 2, 30);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2, metalness: 0.5 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 1, -30);
    stage.receiveShadow = true;
    scene.add(stage);

    const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mainScreen = new THREE.Mesh(new THREE.PlaneGeometry(50, 22), screenMat);
    mainScreen.position.set(0, 13, -30);
    scene.add(mainScreen);
    mainScreenRef.current = mainScreen;

    // --- PERFORMER (YOU) ---
    const performerGroup = new THREE.Group();
    // Unique look for the performer
    const pBodyGeo = createHumanoidBodyGeometry();
    const pSkinGeo = createHumanoidSkinGeometry();
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0xff0044, metalness: 0.8, roughness: 0.1 }); // Shiny outfit
    const pSkinMat = new THREE.MeshStandardMaterial({ color: 0xdcae96, roughness: 0.4 });
    
    const pBody = new THREE.Mesh(pBodyGeo, pBodyMat);
    const pHead = new THREE.Mesh(pSkinGeo, pSkinMat);
    
    performerGroup.add(pBody);
    performerGroup.add(pHead);
    
    performerGroup.scale.set(1.3, 1.3, 1.3); // Hero scale
    performerGroup.position.set(0, 2, -25);
    performerGroup.castShadow = true;
    
    scene.add(performerGroup);
    performerRef.current = performerGroup;

    // Follow Spot for Performer
    const performerSpot = new THREE.SpotLight(0xffffff, 120);
    performerSpot.position.set(0, 30, 20);
    performerSpot.angle = 0.15;
    performerSpot.penumbra = 0.2;
    performerSpot.castShadow = true;
    performerSpot.target = performerGroup;
    scene.add(performerSpot);
    performerSpotRef.current = performerSpot;


    // --- CROWD GENERATION ---
    const baseCount = venue === 'ARENA' ? 3000 : 12000;
    const crowdCount = Math.floor(baseCount * (0.5 + mlStats.sceneOptimization / 100));

    const clothesGeometry = createHumanoidBodyGeometry();
    const skinGeometry = createHumanoidSkinGeometry();
    const lightGeometry = new THREE.PlaneGeometry(0.12, 0.18);

    const clothesMaterial = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.1, color: 0xffffff });
    const skinMaterial = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.0, color: 0xffffff });
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const clothesMesh = new THREE.InstancedMesh(clothesGeometry, clothesMaterial, crowdCount);
    const skinMesh = new THREE.InstancedMesh(skinGeometry, skinMaterial, crowdCount);
    const lightsMesh = new THREE.InstancedMesh(lightGeometry, lightMaterial, crowdCount);

    clothesMesh.castShadow = true; clothesMesh.receiveShadow = true;
    skinMesh.castShadow = true; skinMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const userData: any[] = [];

    for (let i = 0; i < crowdCount; i++) {
        const angle = Math.random() * Math.PI;
        const radius = 20 + Math.random() * (venue === 'ARENA' ? 60 : 180);
        const x = Math.cos(angle) * radius * (Math.random() > 0.5 ? 1 : -1) + (Math.random()-0.5)*10;
        const z = -15 + Math.sin(angle) * radius + (Math.random()-0.5)*10;

        dummy.position.set(x, 0, z);
        dummy.lookAt(0, 4, -30);
        
        const scaleW = 0.9 + Math.random() * 0.25;
        const scaleH = 0.9 + Math.random() * 0.2;
        dummy.scale.set(scaleW, scaleH, scaleW);
        dummy.updateMatrix();

        clothesMesh.setMatrixAt(i, dummy.matrix);
        skinMesh.setMatrixAt(i, dummy.matrix);
        
        // Hide lights initially
        dummy.scale.set(0,0,0);
        dummy.updateMatrix();
        lightsMesh.setMatrixAt(i, dummy.matrix);

        // Distinct colors
        color.setHex(SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)]);
        skinMesh.setColorAt(i, color);

        color.setHex(CLOTHES_TONES[Math.floor(Math.random() * CLOTHES_TONES.length)]);
        clothesMesh.setColorAt(i, color);

        const hasLight = Math.random() > 0.6; // 60% of crowd has phones/lights

        userData.push({
            id: i,
            x, z,
            rotY: dummy.rotation.y,
            scale: { x: scaleW, y: scaleH, z: scaleW },
            phase: Math.random() * Math.PI * 2,
            speed: 0.8 + Math.random() * 0.4,
            hasLight,
            lightColor: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
        });
    }

    scene.add(clothesMesh);
    scene.add(skinMesh);
    scene.add(lightsMesh);

    clothesMeshRef.current = clothesMesh;
    skinMeshRef.current = skinMesh;
    lightsMeshRef.current = lightsMesh;
    userDataRef.current = userData;

    // --- LASERS (Festival Mode) ---
    const laserBeams: THREE.Mesh[] = [];
    if(venue === 'FESTIVAL') {
        const beamGeo = new THREE.CylinderGeometry(0.08, 0.4, 300, 8);
        beamGeo.rotateX(-Math.PI/2);
        beamGeo.translate(0, 0, 150);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        for(let i=0; i<10; i++) {
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set((i-4.5)*8, 2, -28);
            scene.add(beam);
            laserBeams.push(beam);
        }
    }
    lasersRef.current = laserBeams;

    camera.position.set(0, 30, 80);
    camera.lookAt(0, 5, -30);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const isDrop = Math.sin(time * 0.4) > 0.8; // High energy phase

        // 1. Performer Animation
        if(performerRef.current) {
            const p = performerRef.current;
            const pSpeed = isDrop ? 3 : 1;
            
            // Movement: Pacing and Jumping
            p.position.x = Math.sin(time * 0.5) * 10;
            p.position.z = -25 + Math.cos(time * 0.8) * 3;
            
            const jump = Math.max(0, Math.sin(time * 8 * pSpeed) * 0.5);
            p.position.y = 2 + jump;

            p.lookAt(0, 10, 50); // Face crowd
            p.rotation.z = Math.sin(time * 4) * 0.1; // Lean
        }

        // 2. Moving Heads
        movingHeadsRef.current.forEach((h, i) => {
            if(isDrop) {
                // Chaotic movement during drop
                h.group.rotation.y = Math.sin(time * 2 + i) * 1.5;
                h.yoke.rotation.x = Math.sin(time * 4 + i) * 0.8 + 0.5;
            } else {
                // Sweeping movement
                h.group.rotation.y = Math.sin(time * 0.5 + i * 0.2) * 1.0;
                h.yoke.rotation.x = Math.sin(time + i) * 0.4 + 0.6;
            }
            
            // Color cycling
            const hue = (time * 0.2 + i * 0.05) % 1;
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            h.light.color.copy(color);
            h.beamMat.color.copy(color);

            // Strobe
            const strobe = isDrop ? (Math.sin(time * 20) > 0) : true;
            h.light.intensity = strobe ? 200 : 0;
            h.beamMat.opacity = strobe ? 0.2 : 0;
        });

        // 3. Lasers
        lasersRef.current.forEach((l, i) => {
            l.rotation.y = Math.sin(time * 3 + i) * 0.4;
            l.rotation.x = Math.cos(time * 1.5 + i * 0.2) * 0.15;
            
            const hue = (time * 0.5 + i*0.1) % 1;
            (l.material as THREE.MeshBasicMaterial).color.setHSL(hue, 1, 0.5);
            l.visible = isDrop || (Math.sin(time * 2 + i) > 0);
        });

        // 4. Screen Visuals
        if(mainScreenRef.current) {
            (mainScreenRef.current.material as THREE.MeshBasicMaterial).color.setHSL((time * 0.1) % 1, 0.9, 0.6);
        }

        // 5. Crowd Animation
        if (clothesMeshRef.current && skinMeshRef.current && lightsMeshRef.current) {
            const stride = 1; 
            const dummy = new THREE.Object3D();
            
            for (let i = 0; i < crowdCount; i += stride) {
                const ud = userDataRef.current[i];
                
                dummy.position.set(ud.x, 0, ud.z);
                dummy.rotation.set(0, ud.rotY, 0);
                dummy.scale.set(ud.scale.x, ud.scale.y, ud.scale.z);

                const energy = isDrop ? 1.8 : 1.0;
                const jump = Math.max(0, Math.sin(time * 8 + ud.phase) * 0.25 * ud.speed * energy);
                dummy.position.y = jump;
                dummy.rotation.z = Math.sin(time * 3 + ud.phase) * 0.08;

                dummy.updateMatrix();
                clothesMeshRef.current.setMatrixAt(i, dummy.matrix);
                skinMeshRef.current.setMatrixAt(i, dummy.matrix);

                // Phone/Light Animation
                if (ud.hasLight) {
                    dummy.scale.set(1, 1, 1);
                    dummy.position.y += (ud.scale.y * 1.5) + (jump * 0.8);
                    dummy.position.x += 0.3 + Math.sin(time*4 + ud.phase)*0.1;
                    dummy.updateMatrix();
                    lightsMeshRef.current.setMatrixAt(i, dummy.matrix);
                    
                    if(isDrop) {
                        // Flash distinct colors during drop
                        lightsMeshRef.current.setColorAt(i, new THREE.Color().setHSL(Math.random(), 1, 0.6));
                    } else {
                        lightsMeshRef.current.setColorAt(i, ud.lightColor);
                    }
                } else if (Math.random() > 0.999) {
                     // Camera Flashes (White bursts)
                     dummy.scale.set(2, 2, 1); 
                     dummy.position.y += ud.scale.y * 1.5;
                     dummy.updateMatrix();
                     lightsMeshRef.current.setMatrixAt(i, dummy.matrix);
                     lightsMeshRef.current.setColorAt(i, new THREE.Color(0xffffff)); 
                } else {
                    dummy.scale.set(0, 0, 0);
                    dummy.updateMatrix();
                    lightsMeshRef.current.setMatrixAt(i, dummy.matrix);
                }
            }
            clothesMeshRef.current.instanceMatrix.needsUpdate = true;
            skinMeshRef.current.instanceMatrix.needsUpdate = true;
            lightsMeshRef.current.instanceMatrix.needsUpdate = true;
            lightsMeshRef.current.instanceColor!.needsUpdate = true;
        }

        // Cinematic Camera
        const camRad = 85;
        camera.position.x = Math.sin(time * 0.08) * camRad;
        camera.position.z = Math.cos(time * 0.08) * (camRad * 0.3) + 30;
        camera.lookAt(0, 5, -25);

        renderer.render(scene, camera);

        setSceneData({ 
            fps: 60, 
            triangles: renderer.info.render.triangles, 
            crowdSize: crowdCount 
        });
    };
    animate();

    const handleResize = () => {
        if (mountRef.current && rendererRef.current) {
            rendererRef.current.setSize(mountRef.current.clientWidth, 400);
            camera.aspect = mountRef.current.clientWidth / 400;
            camera.updateProjectionMatrix();
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
        if (mountRef.current && rendererRef.current) mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current?.dispose();
    };

  }, [venue, mlStats.sceneOptimization]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="bg-slate-950/90 border-blue-500/30 overflow-hidden relative shadow-2xl shadow-blue-900/20">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button size="sm" onClick={() => setVenue('ARENA')} variant={venue==='ARENA'?'default':'secondary'} className="bg-black/50 backdrop-blur border border-white/10 hover:bg-blue-600/50"><MapPin className="w-3 h-3 mr-2"/> United Center</Button>
                <Button size="sm" onClick={() => setVenue('FESTIVAL')} variant={venue==='FESTIVAL'?'default':'secondary'} className="bg-black/50 backdrop-blur border border-white/10 hover:bg-purple-600/50"><Music className="w-3 h-3 mr-2"/> Coachella</Button>
            </div>
            <div className="absolute top-4 right-4 z-10">
                 <Badge className="bg-red-600 animate-pulse border-none">LIVE 4K</Badge>
            </div>
            <CardContent className="p-0">
                <div ref={mountRef} className="w-full h-[400px] bg-black" />
            </CardContent>
        </Card>
      </div>
      <div>
        <AISceneDirector sceneData={sceneData} mlImprovements={mlStats} />
        <div className="mt-4 p-4 bg-slate-900/80 rounded-lg border border-slate-700 space-y-3 backdrop-blur-sm">
            <h4 className="text-white text-sm font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400"/> Venue Analytics</h4>
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400"><span>Mode</span><span className="text-white font-mono">{venue}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Performer</span><span className="text-red-400 font-bold">Active (You)</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Lighting</span><span className="text-white font-mono">{venue === 'ARENA' ? 'Standard' : 'Festival'} Rig</span></div>
                <div className="h-px bg-slate-700 my-2"></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Crowd</span><span className="text-white font-mono">{sceneData.crowdSize.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Cameras</span><span className="text-blue-400 font-bold">Flash Active</span></div>
            </div>
        </div>
      </div>
    </div>
  );
}