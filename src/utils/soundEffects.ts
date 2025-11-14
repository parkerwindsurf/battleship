export const playExplosionSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create explosion sound using Web Audio API
    const duration = 0.8;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate explosion sound with noise and envelope
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      
      // White noise for explosion
      let noise = Math.random() * 2 - 1;
      
      // Apply envelope (quick attack, decay)
      const envelope = Math.exp(-t * 8) * (1 - Math.exp(-t * 50));
      
      // Add some low frequency rumble
      const rumble = Math.sin(2 * Math.PI * 60 * t) * 0.3 * Math.exp(-t * 3);
      
      data[i] = (noise * 0.7 + rumble) * envelope;
    }
    
    // Create source and play
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Add some filtering for better explosion sound
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
    
    // Add gain for volume control
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    // Connect audio nodes
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    source.start();
    
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};

export const playShipDestroyedSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a more dramatic explosion sound for ship destruction
    const duration = 1.2;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate dramatic explosion sound with multiple layers
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      
      // Multiple layers of noise for complexity
      let noise1 = Math.random() * 2 - 1;
      let noise2 = Math.random() * 2 - 1;
      
      // Complex envelope with multiple stages
      const envelope1 = Math.exp(-t * 6) * (1 - Math.exp(-t * 100));
      const envelope2 = Math.exp(-t * 3) * Math.sin(Math.PI * t / duration);
      
      // Add deep rumble and secondary explosions
      const rumble = Math.sin(2 * Math.PI * 40 * t) * 0.4 * Math.exp(-t * 2);
      const secondaryExplosion = (t > 0.3 && t < 0.5) ? 
        (Math.random() * 2 - 1) * Math.exp(-(t - 0.3) * 10) * 0.5 : 0;
      
      data[i] = (noise1 * 0.5 * envelope1 + 
                 noise2 * 0.3 * envelope2 + 
                 rumble + 
                 secondaryExplosion);
    }
    
    // Create source and play
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Add filtering for dramatic effect
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.5);
    
    // Add gain for volume control with dramatic fade
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    // Connect audio nodes
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    source.start();
    
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};
