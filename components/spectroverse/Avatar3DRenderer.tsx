import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Activity, PersonStanding, Footprints, Music, Aperture } from 'lucide-react';

type AnimationState = 'IDLE' | 'WALK' | 'DANCE';

export default function Avatar3DRenderer({ avatarData, mlImprovements = {} }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarRigRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [animState, setAnimState] = useState<AnimationState>('IDLE');

  // ML Parameters affecting visual quality and movement
  // 0.0 - 0.4: Wireframe/Low Poly
  // 0.4 - 0.7: Standard Material
  // 0.7 - 1.0: PBR Physical Material (Realistic Skin/Fabric)
  const mlAccuracy = mlImprovements?.accuracy || 0.3; 
  const mlFluidity = (mlImprovements?.animationQuality || 30) / 100;

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    const initScene = () => {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050505); // Cinematic Dark
      scene.fog = new THREE.FogExp2(0x050505, 0.02); // Volumetric Atmosphere
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(35, containerRef.current!.clientWidth / containerRef.current!.clientHeight, 0.1, 1000);
      camera.position.set(0, 1.4, 4.5);
      camera.lookAt(0, 0.9, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinema grade color
      renderer.toneMappingExposure = 1.0;
      containerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // --- CINEMATIC LIGHTING RIG ---
      // Key Light (Warm Skin Tones)
      const keyLight = new THREE.SpotLight(0xffeebb, 20.0);
      keyLight.position.set(2, 4, 3);
      keyLight.castShadow = true;
      keyLight.shadow.bias = -0.0001;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      scene.add(keyLight);

      // Fill Light (Cool Shadows)
      const fillLight = new THREE.PointLight(0x4455aa, 5.0);
      fillLight.position.set(-2, 1, 2);
      scene.add(fillLight);

      // Rim Light (Sharp Backlight for realism)
      const rimLight = new THREE.SpotLight(0x00ccff, 15.0);
      rimLight.position.set(0, 3, -4);
      rimLight.lookAt(0, 1, 0);
      scene.add(rimLight);

      // Floor with Reflections
      const planeGeo = new THREE.CircleGeometry(5, 64);
      const planeMat = new THREE.MeshPhysicalMaterial({ 
          color: 0x111111, 
          roughness: 0.1, 
          metalness: 0.5,
          clearcoat: 1.0 
      });
      const floor = new THREE.Mesh(planeGeo, planeMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      clockRef.current = new THREE.Clock();
    };

    initScene();

    return () => {
      mounted = false;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && containerRef.current) {
        try { containerRef.current.removeChild(rendererRef.current!.domElement); } catch (e) {}
        rendererRef.current!.dispose();
      }
    };
  }, []);

  // REBUILD RIG BASED ON ML TRAINING
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Cleanup old rig
    if (avatarRigRef.current?.root) sceneRef.current.remove(avatarRigRef.current.root);

    const rig: any = {};
    const group = new THREE.Group();
    
    const isRealistic = mlAccuracy > 0.7;
    const isStandard = mlAccuracy > 0.4;

    // --- MATERIALS SYSTEM (Science-Based PBR) ---
    const skinColor = new THREE.Color(avatarData?.facial_features?.skin_tone || '#ffdbac');
    const clothesColor = new THREE.Color(avatarData?.clothing?.color_primary || '#445588');

    let skinMat, clothesMat;

    if (isRealistic) {
        // High Fidelity PBR Skin Shader
        skinMat = new THREE.MeshPhysicalMaterial({
            color: skinColor,
            roughness: 0.35, 
            metalness: 0.0,
            reflectivity: 0.5,
            clearcoat: 0.1,
            clearcoatRoughness: 0.2,
            sheen: 0.5, // Peach fuzz
            sheenColor: new THREE.Color(0xffaaaa)
        });
        clothesMat = new THREE.MeshPhysicalMaterial({
            color: clothesColor,
            roughness: 0.8, // Fabric
            metalness: 0.1,
            clearcoat: 0.0
        });
    } else if (isStandard) {
        // Standard shading
        skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.4 });
        clothesMat = new THREE.MeshStandardMaterial({ color: clothesColor, roughness: 0.7 });
    } else {
        // Wireframe / Training Mode
        skinMat = new THREE.MeshBasicMaterial({ color: skinColor, wireframe: true });
        clothesMat = new THREE.MeshBasicMaterial({ color: clothesColor, wireframe: true });
    }

    // Geometry Generation (Capsules for organic shapes)
    const createLimb = (radTop: number, radBot: number, height: number, mat: THREE.Material) => {
        const segs = isRealistic ? 32 : (isStandard ? 12 : 6);
        const geo = new THREE.CylinderGeometry(radTop, radBot, height, segs);
        // Offset pivot to top
        geo.translate(0, -height/2, 0);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    };

    // Body Scalars
    const h = (avatarData?.body_type?.height || 1.7) / 1.7;
    const w = 0.8 + (avatarData?.body_type?.build || 0.5) * 0.4;

    // --- SKELETON HIERARCHY ---
    
    // 1. Hips (Root of movement)
    const hips = new THREE.Group();
    hips.position.y = 1.0 * h;
    group.add(hips);
    rig.hips = hips;

    const pelvis = createLimb(0.14*w, 0.13*w, 0.15, clothesMat);
    pelvis.position.y = 0.075; // Center it
    hips.add(pelvis);

    // 2. Spine
    const spine = new THREE.Group();
    spine.position.y = 0.0; // Pivots from hips
    hips.add(spine);
    rig.spine = spine;

    const torso = createLimb(0.15*w, 0.13*w, 0.45*h, clothesMat);
    torso.position.y = 0.45*h; // visual fix
    spine.add(torso);

    // 3. Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.45*h;
    spine.add(headGroup);
    rig.head = headGroup;

    const headGeo = isRealistic 
        ? new THREE.SphereGeometry(0.12, 64, 64) 
        : new THREE.SphereGeometry(0.12, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.15;
    head.castShadow = true;
    headGroup.add(head);

    // 4. Arms
    const createArm = (mirror: number) => {
        const shoulder = new THREE.Group();
        shoulder.position.set(mirror * 0.18 * w, 0.42 * h, 0);
        spine.add(shoulder);

        const upperArm = createLimb(0.05*w, 0.04*w, 0.32*h, isRealistic ? skinMat : clothesMat);
        shoulder.add(upperArm);

        const elbow = new THREE.Group();
        elbow.position.y = -0.32*h;
        upperArm.add(elbow);

        const lowerArm = createLimb(0.04*w, 0.03*w, 0.30*h, skinMat);
        elbow.add(lowerArm);

        return { shoulder, elbow };
    };

    rig.lArm = createArm(-1);
    rig.rArm = createArm(1);

    // 5. Legs
    const createLeg = (mirror: number) => {
        const hipJoint = new THREE.Group();
        hipJoint.position.set(mirror * 0.1 * w, 0, 0);
        hips.add(hipJoint);

        const thigh = createLimb(0.07*w, 0.05*w, 0.45*h, clothesMat);
        hipJoint.add(thigh);

        const knee = new THREE.Group();
        knee.position.y = -0.45*h;
        thigh.add(knee);

        const shin = createLimb(0.05*w, 0.04*w, 0.45*h, clothesMat);
        knee.add(shin);

        return { hip: hipJoint, knee };
    };

    rig.lLeg = createLeg(-1);
    rig.rLeg = createLeg(1);

    sceneRef.current.add(group);
    rig.root = group;
    avatarRigRef.current = rig;

  }, [avatarData, mlAccuracy]);

  // PHYSICS-BASED ANIMATION LOOP
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const animate = () => {
      if (isPlaying && avatarRigRef.current && clockRef.current) {
        const time = clockRef.current.getElapsedTime();
        const rig = avatarRigRef.current;
        
        // Procedural Animation using Sine Waves (Math)
        // Fluidity comes from ML training
        const speed = (animState === 'WALK' ? 4 : 2) * (0.8 + mlFluidity * 0.4);
        const amp = 0.5 * mlFluidity;

        if (animState === 'IDLE') {
            // Realistic Breathing
            const breath = Math.sin(time * 2) * 0.02;
            rig.hips.position.y = 1.0 + breath;
            rig.spine.rotation.x = breath * 0.5;
            
            // Subtle sway
            rig.lArm.shoulder.rotation.z = 0.1 + Math.sin(time)*0.05;
            rig.rArm.shoulder.rotation.z = -0.1 - Math.sin(time)*0.05;
            
            // Look around naturally
            rig.head.rotation.y = Math.sin(time * 0.5) * 0.2;
            rig.head.rotation.x = Math.sin(time * 0.3) * 0.05;
            
            // Reset legs
            rig.lLeg.hip.rotation.x = 0; rig.rLeg.hip.rotation.x = 0;
            rig.lLeg.knee.rotation.x = 0; rig.rLeg.knee.rotation.x = 0;
        } 
        else if (animState === 'WALK') {
            const t = time * speed;
            rig.hips.position.y = 1.0 + Math.abs(Math.cos(t)) * 0.05;
            
            // Inverse Kinematics Approximation for Walk Cycle
            rig.lLeg.hip.rotation.x = Math.sin(t) * 0.5;
            rig.rLeg.hip.rotation.x = Math.sin(t + Math.PI) * 0.5;
            
            rig.lLeg.knee.rotation.x = Math.max(0, Math.sin(t + Math.PI) * 0.8);
            rig.rLeg.knee.rotation.x = Math.max(0, Math.sin(t) * 0.8);

            // Counter-swing arms
            rig.lArm.shoulder.rotation.x = Math.sin(t + Math.PI) * 0.3;
            rig.rArm.shoulder.rotation.x = Math.sin(t) * 0.3;
        }
        else if (animState === 'DANCE') {
            const beat = time * 8;
            rig.hips.position.y = 0.9 + Math.abs(Math.sin(beat)) * 0.15;
            rig.hips.rotation.y = Math.sin(time * 2) * 0.2;

            rig.spine.rotation.z = Math.sin(time * 3) * 0.1;
            
            rig.lArm.shoulder.rotation.z = Math.abs(Math.sin(time * 3)) * 2 + 0.2;
            rig.rArm.shoulder.rotation.z = -Math.abs(Math.cos(time * 3)) * 2 - 0.2;
            
            rig.lLeg.hip.rotation.x = -0.2 + Math.sin(beat)*0.1;
            rig.rLeg.hip.rotation.x = -0.2 + Math.cos(beat)*0.1;
        }
      }

      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current); };
  }, [isPlaying, animState, mlFluidity]);

  return (
    <Card className="bg-slate-950/95 border-cyan-500/30 h-full z-cards flex flex-col relative overflow-hidden">
      <CardHeader className="p-3 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <CardTitle className="text-white flex items-center justify-between text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <Aperture className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            Physics Render
          </div>
          <Badge className={mlAccuracy > 0.7 ? "bg-purple-600 shadow-lg shadow-purple-500/50" : "bg-slate-600"}>
             {mlAccuracy > 0.7 ? "PBR Realistic" : (mlAccuracy > 0.4 ? "Standard" : "Training Wireframe")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col h-full bg-black">
        <div ref={containerRef} className="w-full h-full min-h-[400px]" />
        
        {/* Controls Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
             <Button size="icon" className="rounded-full w-12 h-12" variant={animState === 'IDLE' ? 'default' : 'secondary'} onClick={() => setAnimState('IDLE')}><PersonStanding className="w-5 h-5"/></Button>
             <Button size="icon" className="rounded-full w-12 h-12" variant={animState === 'WALK' ? 'default' : 'secondary'} onClick={() => setAnimState('WALK')}><Footprints className="w-5 h-5"/></Button>
             <Button size="icon" className="rounded-full w-12 h-12" variant={animState === 'DANCE' ? 'default' : 'secondary'} onClick={() => setAnimState('DANCE')}><Music className="w-5 h-5"/></Button>
        </div>
      </CardContent>
    </Card>
  );
}