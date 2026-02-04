import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SpectroVersePage from './pages/SpectroVersePage';
import SystemCheckPage from './pages/SystemCheckPage';
import MLTrainingPage from './pages/MLTrainingPage';
import SceneGeneratorPage from './pages/SceneGeneratorPage';
import AvatarCustomizerPage from './pages/AvatarCustomizerPage';
import PhysicsEnginePage from './pages/PhysicsEnginePage';
import ProRes4KPage from './pages/ProRes4KPage';
import SpectroVerseAssistant from './components/spectroverse/SpectroVerseAssistant';

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-900 text-white font-sans antialiased">
        <Routes>
          <Route path="/" element={<Navigate to="/SpectroVerse" replace />} />
          <Route path="/SpectroVerse" element={<SpectroVersePage />} />
          <Route path="/SystemCheck" element={<SystemCheckPage />} />
          <Route path="/MLTraining" element={<MLTrainingPage />} />
          <Route path="/SceneGenerator" element={<SceneGeneratorPage />} />
          <Route path="/AvatarCustomizer" element={<AvatarCustomizerPage />} />
          <Route path="/PhysicsEngine" element={<PhysicsEnginePage />} />
          <Route path="/ProRes4K" element={<ProRes4KPage />} />
        </Routes>
        <SpectroVerseAssistant />
      </div>
    </HashRouter>
  );
}