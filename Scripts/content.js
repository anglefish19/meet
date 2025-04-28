import { defineAsyncComponent } from "vue";
import { UserContent } from "./userContent.js";
import { GeneralContent } from "./generalContent.js";

export async function Content() {
  return {
    components: { 
      UserContent: defineAsyncComponent(UserContent),
      GeneralContent: defineAsyncComponent(GeneralContent)
    },
    template: await fetch("./Components/content.html").then((r) => r.text()),
  };
}