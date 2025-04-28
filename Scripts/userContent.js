import { defineAsyncComponent } from "vue";
import { NavBar } from "./navbar.js";
import { SideBar } from "./sidebar.js";
import { ChatWindow } from "./chatWindow.js";

export async function UserContent() {
  return {
    props: ["username"],

    components: { 
      NavBar: defineAsyncComponent(NavBar),
      SideBar: defineAsyncComponent(SideBar),
      ChatWindow: defineAsyncComponent(ChatWindow)
    },

    template: await fetch("./Components/userContent.html").then((r) => r.text()),
  };
}