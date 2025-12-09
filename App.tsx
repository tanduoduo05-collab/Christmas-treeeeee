import React, { useState } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';

const App: React.FC = () => {
  const [isTreeForm, setIsTreeForm] = useState(false);

  return (
    <div className="w-full h-screen relative bg-black">
      <Scene isTreeForm={isTreeForm} />
      <UI isTreeForm={isTreeForm} onToggle={() => setIsTreeForm(!isTreeForm)} />
    </div>
  );
};

export default App;