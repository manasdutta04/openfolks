import { DownloadSection, Faq, Features, Final, Footer, Guides, Hero, Jobs, Local, MessageCard, Nav } from "./components/Sections";

export function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MessageCard />
        <Features />
        <Jobs />
        <Local />
        <DownloadSection />
        <Guides />
        <Faq />
        <Final />
      </main>
      <Footer />
    </>
  );
}
