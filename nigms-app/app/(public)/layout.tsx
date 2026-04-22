import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SteelFrameContainer from '@/components/SteelFrameContainer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <SteelFrameContainer>{children}</SteelFrameContainer>
      <Footer />
    </>
  );
}
