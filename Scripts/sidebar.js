import { defineAsyncComponent } from "vue";
import { ChatList } from "./chatList.js";
import { NewChatForm } from "./newChatForm.js";

export async function SideBar() {
    return {
      props: ["username", "view", "inviteSchema", "profileSchema"],
      emits: ["channel"],

      components: { 
        ChatList: defineAsyncComponent(ChatList),
        NewChatForm: defineAsyncComponent(NewChatForm),
      },

      template: await fetch("./Components/sidebar.html").then((r) => r.text()),
    };
}  