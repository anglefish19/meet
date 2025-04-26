import { createApp } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";

createApp({
  data() {
    return {
      message: "",
      revisedMessage: "",
      chatName: "",
      newChatName: "",
      sending: false,
      revising: false,
      creating: false,
      adding: false,
      channels: ["designftw"],
      currentChat: "no chat selected",
      currentChatName: "no chat selected",
      members: "",
      newMembers: "",
    };
  },

  methods: {
    async sendMessage(session) {
      if (!this.message) {
        alert("Please compose a message first!");
        return;
      }

      if (this.currentChat == "No Chats Selected") {
        alert("Please select a chat first!");
        return;
      }

      this.sending = true;

      await this.$graffiti.put(
        {
          value: {
            content: this.message,
            published: Date.now(),
          },
          channels: [this.currentChat.channel],
        },
        session,
      );

      this.sending = false;
      this.message = "";

      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
    },

    async editMessage(e, messageObject) {
      if (!this.revisedMessage) {
        alert("Please compose a message first!");
        return;
      }

      this.revising = true;

      await this.$graffiti.patch(
        {
          value: [
            { "op": "replace", "path": "/content" , "value": this.revisedMessage },
            { "op": "add", "path": "/revised", "value": Date.now() },
          ],
        },
        messageObject,
        this.$graffitiSession.value,
      );

      this.revising = false;
      this.revisedMessage = "";

      // Refocus the input field after sending the message
      await this.$nextTick();
      e.target.closest("li").lastElementChild.classList.remove("reveal");
    },

    async deleteMessage(messageObject) {
      await this.$graffiti.delete(messageObject, this.$graffitiSession.value);
    },

    async createChat(session) {
      if (!this.chatName) {
        alert("Please enter a name for the chat first!");
        return;
      }

      this.creating = true;

      const channel = crypto.randomUUID(); // This creates a random string

      await this.$graffiti.put(
        {
          value: {
            activity: 'Create',
            object: {
              type: 'Group Chat',
              name: this.chatName,
              channel: channel,
              created: Date.now(),
            }
          },
          channels: this.channels,
        },
        session,
      );
      
      await this.addMembers(session, channel, this.members);

      this.creating = false;
      this.chatName = "";
      

      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.chatNameInput.focus();
    },

    async addMembers(session, channel, members) {
      console.log("in fxn");
      if (!channel) {
        alert("Please select a chat first!");
        return;
      } else if (channel == this.currentChat.channel) {
        this.adding = true;
      }

      console.log(channel);
      console.log(this.currentChat.channel);

      if (members) {
        members = members.split(", ");
      }

      for (const member of members) {
        await this.$graffiti.put(
          {
            value: {
              activity: 'Add',
              object: member,
              target: channel,
            },
            channels: this.channels,
          },
          session,
        );
      }

      if (channel == this.currentChat.channel) {
        this.newMembers = "";
      } else {
        this.members = "";
      }
      this.adding = false;
    },

    updateCurrentChat(chat) {
      this.currentChat = chat;
      this.currentChatName = chat.name;
    },

    async editChatName(e, chatObject) {
      if (!this.newChatName) {
        alert("Please enter a name for the chat first!");
        return;
      }

      this.revising = true;

      await this.$graffiti.patch(
        {
          value: [
            { "op": "replace", "path": "/object/name" , "value": this.newChatName },
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
})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiLocal(),
    // graffiti: new GraffitiRemote(),
  })
  .mount("#app");
