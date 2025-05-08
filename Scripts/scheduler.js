export async function Scheduler() {
  return {
    data() {
      // const grid = {
      //     date: {
      //         time: {
      //             hour: { 
      //                q1: true if availabile, false otherwise 
                  // }
      //         }
      //     }
      // }
      return {

        //   newChatName: "",
        creating: false,
        //   members: "",
      };
    },

    mounted() {
      function createOption(value, text) {
        const option = document.createElement('option');
        option.text = text;
        option.value = value;
        return option;
      }

      function setupOptions(timeElement) {
        for (let h = 8; h <= 24; h++) {
          let text = "";
          text += h > 12 ? h - 12 : h;
          let quarter = 0;
          for (let m = 0; m < 60; m += 15) {
            let addedText = "";
            addedText += m == 0 ? ":00" : ":" + m;
            addedText += (h >= 12 && h < 24) ? " PM" : " AM";
            timeElement.add(createOption([h, quarter], text + addedText));
            quarter++;
          }
        }
        
      }

      const startTime = document.getElementById('startTime');
      const endTime = document.getElementById('endTime');
      setupOptions(startTime);
    },

    methods: {
      setupScheduler() {

      }
      // async createChat() {
      //   if (!this.newChatName) {
      //     alert("Please enter a name for the chat first!");
      //     return;
      //   }

      //   this.creating = true;

      //   const channel = crypto.randomUUID(); // This creates a random string
      //   if (this.members != "") {
      //     this.members = this.members.split(", ");
      //     this.members.push(this.$graffitiSession.value.actor);
      //   } else {
      //     this.members = [this.$graffitiSession.value.actor];
      //   }

      //   await this.$graffiti.put(
      //     {
      //       channels: this.members,
      //       value: {
      //         activity: 'Invite',
      //         target: "Chat",
      //         participants: this.members,
      //         title: this.newChatName,
      //         published: Date.now(),
      //         channel: channel,
      //       },
      //       allowed: this.members,
      //     },
      //     this.$graffitiSession.value,
      //   );

      //   const chatName = this.newChatName;

      //   this.creating = false;
      //   this.members = "";
      //   this.newChatName = "";

      //   this.$router.push(`/` + this.$graffitiSession.value.actor + `/chats/` + chatName + `/` + channel);
      // },
    },

    template: await fetch("./Components/scheduler.html").then((r) => r.text()),
  };
}  