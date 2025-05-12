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
        leftChats: [],

        leftSchema: {
          properties: {
            value: {
              required: ['activity', 'target', 'requester'],
              properties: {
                activity: { enum: ['Leave Chat'] },
                target: { type: 'string' },
                requester: { type: 'string' }
              }
            }
          }
        },
      };
    },

    mounted() {
      this.getLeftChats();
    },

    methods: {
      isInChats(invitations) {
        return invitations.filter(i => !this.hasLeft(i.value.channel)).length != 0;
      },

      hasLeft(channel) {
        return this.leftChats.filter(lc => lc == channel).length != 0;
      },

      async getLeftChats() {
        const leftChats = this.$graffiti.discover(
          [this.username], // channels
          this.leftSchema // schema
        );

        const leftChatsArray = [];
        for await (const { object } of leftChats) {
          leftChatsArray.push(object);
        }
        
        for (const lc of leftChatsArray) {
          const approved = this.$graffiti.discover(
            [lc.url], // channels
            {} // schema
          );
  
          const approvedArray = [];
          for await (const { object } of approved) {
            approvedArray.push(object);
          }

          if (approvedArray.length != 0) {
            await this.$graffiti.delete(lc.url, this.$graffitiSession.value);
          } else {
            this.leftChats.push(lc.value.target);
          }
        };
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