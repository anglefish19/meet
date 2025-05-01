export async function NewChatForm() {
    return {
      data() {
        return {
          newChatName: "",
          creating: false,
          members: "",
        };
      },

      methods: {
        async createChat() {
          if (!this.newChatName) {
            alert("Please enter a name for the chat first!");
            return;
          }
    
          this.creating = true;
    
          const channel = crypto.randomUUID(); // This creates a random string
          if (this.members != "") {
            this.members = this.members.split(", ");
            this.members.push(this.$graffitiSession.value.actor);
          } else {
            this.members = [this.$graffitiSession.value.actor];
          }

          await this.$graffiti.put(
            {
              channels: this.members,
              value: {
                activity: 'Invite',
                target: "Chat",
                participants: this.members,
                title: this.newChatName,
                published: Date.now(),
                channel: channel,
              },
              allowed: this.members,
            },
            this.$graffitiSession.value,
          );

          const chatName = this.newChatName;

          this.creating = false;
          this.members = "";
          this.newChatName = "";

          this.$router.push(`/` + this.$graffitiSession.value.actor + `/chats/` + chatName + `/` + channel);
        },
      },

      template: await fetch("./Components/newChatForm.html").then((r) => r.text()),
    };
}  