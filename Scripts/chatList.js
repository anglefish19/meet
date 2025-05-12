import { defineAsyncComponent } from "vue";
import { ITD } from "./itd.js";

export async function ChatList() {
  return {
    props: ["username", "inviteSchema"],

    data() {
      return {
        chatName: "",
        newChatName: "",
        creating: false,
        adding: false,
        sending: false,
        revising: false,
        currentChat: "no chat selected",
        currentChatName: "no chat selected",
        members: "",
      };
    },

    components: {
      ITD: defineAsyncComponent(ITD),
    },

    methods: {
      async editChatName(e, chatObject) {
        if (!this.newChatName) {
          alert("Please enter a name for the chat first!");
          return;
        }

        this.revising = true;

        await this.$graffiti.patch(
          {
            value: [
              { "op": "replace", "path": "/object/name", "value": this.newChatName },
              { "op": "add", "path": "/object/revised", "value": Date.now() },
            ],
          },
          chatObject,
          this.$graffitiSession.value,
        );

        this.revising = false;
        this.newChatName = "";

        // Refocus the input field after sending the message
        await this.$nextTick();
        e.target.closest("li").lastElementChild.classList.remove("reveal");
      },

      async deleteChat(chatObject) {
        await this.$graffiti.delete(chatObject, this.$graffitiSession.value);
      },

      revealInput(e) {
        e.target.closest("li").lastElementChild.classList.toggle("reveal");
        e.target.closest("li").lastElementChild.firstElementChild.focus();
      },
    },

    template: await fetch("./Components/chatList.html").then((r) => r.text()),
  };
}  