import ScrollExperienceClient from "@/components/ScrollExperienceClient";
import About from "@/components/About";
import Services from "@/components/Services";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Divider = () => (
  <div
    className="divider"
    aria-hidden="true"
  />
);

export default function Home() {
  return (
    <main>
      <ScrollExperienceClient />

      <Divider />
      <About />

      <Divider />
      <Services />

      <Divider />
      <Projects />

      <Divider />
      <Contact />

      <Divider />
      <Footer />
    </main>
  );
}