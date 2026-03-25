import { useEffect, useRef, useState } from 'react';

const videos = [
  '/videos/video1.mp4',
  '/videos/video2.mp4',
  '/videos/video3.mp4',
  '/videos/video4.mp4',
  '/videos/video5.mp4',
];

const HomeVideoSection = () => {
  const [index, setIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [index]);

  return (
    <section className="home-video-section" aria-label="Novastone videos">
      <video
        key={videos[index]}
        ref={videoRef}
        src={videos[index]}
        className="home-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setIndex((prev) => (prev + 1) % videos.length)}
      />
    </section>
  );
};

export default HomeVideoSection;
