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
