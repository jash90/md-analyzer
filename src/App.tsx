import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import { useSettings } from "./hooks/useSettings";

function App() {
  // Hydrate settings from store on mount
  useSettings();

  return (
    <>
      <Layout />
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
      />
    </>
  );
}

export default App;
