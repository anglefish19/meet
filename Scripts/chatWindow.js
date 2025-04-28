export async function ChatWindow() {
    return {
      props: ["chatName", "channel"],
      
      data() {
        return {
          newChatName: "",
          message: "",
          revisedMessage: "",
          creating: false,
          adding: false,
          sending: false,
          revising: false,
          channels: ["designftw"],
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
    
          this.sending = true;
    
          await this.$graffiti.put(
            {
              value: {
                content: this.message,
                published: Date.now(),
              },
              channels: [this.channel],
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
    
        async addMembers(session, channel, members) {
          if (channel == this.channel) {
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
    
          if (channel == this.channel) {
            this.newMembers = "";
          } else {
            this.members = "";
          }
          this.adding = false;
        },
  
        revealInput(e) {
          e.target.closest("li").lastElementChild.classList.toggle("reveal");
          e.target.closest("li").lastElementChild.firstElementChild.focus();
        },
      },

      template: await fetch("./Components/chatWindow.html").then((r) => r.text()),
    };
}  