// import { defineAsyncComponent } from "vue";
// import { ITD } from "./itd.js";

export async function ChatWindow() {
  return {
    props: ["chatName", "channel", "inviteSchema", "profileSchema", "username"],

    data() {
      // const path = this.$route.path.split("/");
      // let channel = path.pop();
      // if (channel == "chats") {
      //   channel = undefined;
      // } else {
      //   chatName = path.pop();
      // }

      // SCHEDULER STUFF
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const weekFromTomorrow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        newChatName: "",
        message: "",
        revisedMessage: "",
        adding: false,
        sending: false,
        revising: false,
        members: "",
        newMembers: "",

        chatSchema: {
          properties: {
            value: {
              required: [
                "activity",
                "target",
                "title",
                "published",
                "participants",
                "channel",
              ],
              properties: {
                activity: { enum: ["Invite"] },
                target: { enum: ["Chat"] },
                participants: {
                  type: "array",
                  items: { type: "string" },
                },
                published: { type: "number" },
                title: { type: "string" },
                channel: { enum: [this.channel] },
              },
            },
          },
        },

        messageSchema: {

        },

        // SCHEDULER STUFF
        offset: offset * 60 * 1000,
        today: today,
        minDate: today.toISOString().split('T')[0],
        schedulerTitle: "",
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: weekFromTomorrow.toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        creating: false,
        isDragging: false,
        initialSelected: false,
        timeMouseDown: undefined,
        startX: undefined,
        startY: undefined,
        dragBox: undefined,
        availability: {
          // colnum: {
          //   date: Date,
          //   hours: {
          //     hour (1-24): true / false (true = available from i to i+1)
          //   }
          // }
        },
      };
    },

    // components: {
    //   ITD: defineAsyncComponent(ITD),
    // },

    mounted() {
      function createOption(value, text) {
        const option = document.createElement('option');
        option.text = text;
        option.value = value;
        return option;
      }

      function setupOptions(timeElement) {
        for (let h = 8; h <= 24; h++) {
          let text = h > 12 ? h - 12 : h;
          text += (h >= 12 && h < 24) ? " PM" : " AM";
          timeElement.add(createOption(h, text));
          h = h == 24 ? 0 : h;
          h = h == 7 ? 24 : h;
        }
      }

      const startTime = document.getElementById('startTime');
      const endTime = document.getElementById('endTime');
      setupOptions(startTime);
      setupOptions(endTime);
      this.startTime = 8;
      this.endTime = 22;
    },

    methods: {
      async renameChat(invite) {
        const name = prompt(
          "Rename chat",
          invite.value.title,
        );
        if (!name) return;

        await this.$graffiti.put(
          {
            ...invite,
            value: { ...invite.value, title: name },
          },
          this.$graffitiSession.value,
        );

        this.$router.push(`/` + this.username + `/chats/` + name + `/` + this.channel);
      },

      async deleteChat(invite) {
        if (!confirm("You're about to delete \"" + invite.value.title + "\". Are you sure you want to delete this chat?")) {
          return;
        }

        await this.$graffiti.delete(
          invite,
          this.$graffitiSession.value,
        );

        this.$router.push(`/` + this.username + `/chats/`);
      },

      async addMembers(invite) {
        let members = prompt('Add members (separate usernames using ", ")');
        if (!members) {
          return;
        }
        else {
          members = members.split(",");
        }

        const channels = new Set(members);
        invite.channels.map(c => channels.add(c));

        invite.value.participants.map(p => members.push(p));
        members = [...new Set(members)];

        const allowed = [];
        for (const m of members) {
          const profiles = this.$graffiti.discover(
            // channels
            [m],
            // schema
            this.profileSchema
          );
          const profileArray = [];
          for await (const { object } of profiles) {
            profileArray.push(object);
          }
          const profile = profileArray[0];
          if (profile.actor) {
            allowed.push(profile.actor);
          }
        }

        await this.$graffiti.put(
          {
            ...invite,
            channels: [...channels],
            value: {
              ...invite.value,
              participants: members,
            },
            allowed: [...allowed],
          },
          this.$graffitiSession.value,
        );
      },

      async removeMember(invite, member, isOwner) {
        let actor;
        if (isOwner && invite.value.participants.length == 1) {
          this.deleteChat(invite);
          return;
        } else if (isOwner) {
          actor = invite.value.participants.filter((p) => p !== member)[0];
        } else {
          actor = invite.actor;
        }
        await this.$graffiti.put(
          {
            ...invite,
            channels: invite.channels.filter((c) => c !== member),
            value: {
              ...invite.value,
              participants: invite.value.participants.filter((p) => p !== member),
            },
            allowed: invite.allowed.filter((a) => a !== member),
            actor: actor
          },
          this.$graffitiSession.value,
        );
      },

      async sendMessage() {
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
          this.$graffitiSession.value,
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
              { "op": "replace", "path": "/content", "value": this.revisedMessage },
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

      // async addMembers(channel, members) {
      //   if (channel == this.channel) {
      //     this.adding = true;
      //   }

      //   if (members) {
      //     members = members.split(", ");
      //   }

      //   for (const member of members) {
      //     await this.$graffiti.put(
      //       {
      //         value: {
      //           activity: 'Add',
      //           object: member,
      //           target: channel,
      //         },
      //         channels: this.channels,
      //       },
      //       this.$graffitiSession.value,
      //     );
      //   }

      //   if (channel == this.channel) {
      //     this.newMembers = "";
      //   } else {
      //     this.members = "";
      //   }
      //   this.adding = false;
      // },

      revealInput(e) {
        e.target.closest("li").lastElementChild.classList.toggle("reveal");
        e.target.closest("li").lastElementChild.firstElementChild.focus();
      },

      // SCHEDULER STUFF
      setupScheduler() {
        const comparativeST = new Date((new Date(this.startDate)).getTime() + this.offset);
        const comparativeET = new Date((new Date(this.endDate)).getTime() + this.offset);

        if (comparativeST < this.today) {
          alert("You can't make a scheduler with dates already in the past.");
          return;
        }

        document.querySelectorAll(".hiddenUnlessReveal").forEach(e => {
          e.classList.toggle("reveal")
        });

        const schedulerGrid = document.getElementById('grid');

        // Set rows & columns
        const numRows = this.endTime - this.startTime;
        const numCols = (comparativeET - comparativeST) / (1000 * 60 * 60 * 24) + 1;

        if (numCols < 0) {
          alert("Entered dates are invalid — the second date cannot happen before the first date!");
          return;
        } else if (numRows <= 0) {
          alert("Entered times are invalid — second time must be greater than first!");
          return;
        }

        if (this.schedulerTitle == "") {
          this.schedulerTitle = "Scheduler for " + this.getDateString(comparativeST) + " to " + this.getDateString(comparativeET);
        }

        schedulerGrid.style.gridTemplateRows = `8px repeat(${numRows}, 30px)`;
        schedulerGrid.style.gridTemplateColumns = `repeat(${numCols}, 50px)`;

        // Create grid
        for (let i = 0; i < numCols; i++) {
          const spacer = document.createElement('div');
          spacer.classList.add('empty');
          schedulerGrid.appendChild(spacer);
        }
        for (let i = 0; i < numRows * numCols; i++) {
          const cell = document.createElement('div');
          cell.classList.add('grid-cell');
          cell.addEventListener('mousedown', (e) => this.startDrag(e, cell));
          cell.addEventListener('dragstart', (e) => e.preventDefault());
          schedulerGrid.appendChild(cell);
        }

        // Add date labels
        const dateLabels = document.getElementById('dateLabels');
        dateLabels.style.gridTemplateColumns = `repeat(${numCols}, 50px)`;
        let current = comparativeST;
        for (let i = 0; i < numCols; i++) {
          const label = document.createElement('h3');
          label.textContent = this.getDateString(current);
          this.availability[i+1] = {
            date: current,
            hours: {}
          };
          dateLabels.appendChild(label);
          current = this.getNextDate(current);
        }

        // Add time labels
        const timeLabels = document.getElementById('timeLabels');
        timeLabels.style.gridTemplateRows = `repeat(${numRows}, 30px)`;
        for (let i = this.startTime; i <= this.endTime; i++) {
          const label = document.createElement('h3');

          let text = i > 12 ? i - 12 : i;
          text += (i >= 12 && i < 24) ? " PM" : " AM";
          label.textContent = text;

          if (i != this.endTime) {
            Object.keys(this.availability).map(k => this.availability[k]["hours"][i] = false);
          }

          timeLabels.appendChild(label);
        }

        // Add functionality
        const clearButton = document.getElementById('clearButton');

        document.addEventListener('mousemove', (e) => {
          if (this.isDragging) {
            const currentX = e.pageX;
            const currentY = e.pageY;

            this.dragBox.style.width = `${Math.abs(currentX - this.startX)}px`;
            this.dragBox.style.height = `${Math.abs(currentY - this.startY)}px`;
            this.dragBox.style.left = `${Math.min(this.startX, currentX)}px`;
            this.dragBox.style.top = `${Math.min(this.startY, currentY)}px`;
          }
        });

        document.addEventListener('mouseup', () => {
          if (this.isDragging) {
            document.querySelectorAll('.grid-cell').forEach(cell => {
              const rect = cell.getBoundingClientRect();
              const cellInBox = rect.right >= Math.min(this.startX, this.dragBox.getBoundingClientRect().left) &&
                                rect.left <= Math.max(this.startX, this.dragBox.getBoundingClientRect().right) &&
                                rect.bottom + window.scrollY >= Math.min(this.startY, this.dragBox.getBoundingClientRect().top + window.scrollY) &&
                                rect.top + window.scrollY <= Math.max(this.startY, this.dragBox.getBoundingClientRect().bottom + window.scrollY);
        
              if (cellInBox) this.toggleCell(cell);
            });
        
            this.dragBox.remove();
            this.dragBox = undefined;
            this.isDragging = false;
            this.startX = undefined;
            this.startY = undefined;
          }

          if (this.isDragging && performance.now() - this.mouseDownTime > 4) {
            this.isDragging = false;
          }
        });
      },

      async sendScheduler() {
        let cellCount = 1;
        const divisor = Object.keys(this.availability).length;
        document.querySelectorAll('.grid-cell').forEach(cell => {
          const rowNum = cellCount % divisor == 0 ? divisor : cellCount % divisor;
          this.availability[rowNum]["hours"][this.startTime + Math.floor((cellCount - 1) / divisor)] = cell.classList.contains('selected');
          cellCount++;
        });
      },

      // given date, return next date
      getNextDate(givenDate) {
        return new Date(givenDate.getTime() + 24 * 60 * 60 * 1000);
      },

      getDateString(date) {
        return (date.getUTCMonth() + 1) + "/" + date.getUTCDate();
      },

      startDrag(e, cell) {
        this.isDragging = true;
        cell.classList.toggle('selected');
        this.initialSelected = cell.classList.contains('selected');
        this.startX = e.pageX;
        this.startY = e.pageY;

        this.dragBox = document.createElement('div');
        this.dragBox.classList.add('dragging-area');
        this.dragBox.style.left = `${this.startX}px`;
        this.dragBox.style.top = `${this.startY}px`;
        this.dragBox.style.width = `1px`;
        this.dragBox.style.height = `1px`;
        document.body.appendChild(this.dragBox);
      },

      toggleCell(cell) {
        const isSelected = cell.classList.contains('selected');
        if (isSelected != this.initialSelected) {
          cell.classList.toggle('selected');
        }
      },

      clearAll() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
          cell.classList.remove('selected');
        });
      },

      toggleScheduler() {
        document.querySelector('.scheduler').classList.toggle("revealScheduler");
      }
    },

    template: await fetch("./Components/chatWindow.html").then((r) => r.text()),
  };
}  