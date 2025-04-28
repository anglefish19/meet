export async function SideBar() {
    return {
      props: ["username"],
      
      data() {
        return {
          chatName: "",
          newChatName: "",
          message: "",
          revisedMessage: "",
          creating: false,
          adding: false,
          sending: false,
          revising: false,
          channels: ["designftw"],
          currentChat: "no chat selected",
          currentChatName: "no chat selected",
          members: "",
          newMembers: "",
        };
      },

      methods: {
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
          if (!channel) {
            alert("Please select a chat first!");
            return;
          } else if (channel == this.currentChat.channel) {
            this.adding = true;
          }
    
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

      template: await fetch("./Components/sidebar.html").then((r) => r.text()),
    };
}  