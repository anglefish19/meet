export async function Scheduler() {
  return {
    props: ['schedulerTitle', 'schedulerObject', 'channel', 'schedulerSchema', 'offset', "username"],

    data() {
      return {
        startTime: undefined,
        endTime: undefined,
        startDate: undefined,
        endDate: undefined,
        availability: {},
        allAvailability: {
          // col: {
          //   date: Date,
          //   hours: {
          //     h: [usernames of ppl available]
          //   }
          // }
        },
        colors: ["oklch(0.94 0.0197 17.51)"],
        rgb: "37, 97, 149",
        index: -1,

        availabilitySchema: {
          properties: {
            value: {
              required: ['activity', 'target', 'username', 'availability', 'created', 'lastEdited'],
              properties: {
                activity: { enum: ["FillScheduler"] },
                target: { enum: ["Scheduler"] },
                username: { type: 'string' },
                created: { type: 'number' },
                lastEdited: { type: 'number' }
              }
            }
          }
        }
      };
    },

    mounted() {
      this.startTime = this.schedulerObject.value.startTime;
      this.endTime = this.schedulerObject.value.endTime;
      this.startDate = this.schedulerObject.value.startDate;
      this.endDate = this.schedulerObject.value.endDate;

      this.setupScheduler();
    },

    methods: {
      async setupScheduler() {
        // get index of scheduler
        const schedulers = this.$graffiti.discover(
          [this.channel], // channels
          this.schedulerSchema // schema
        );

        const schedulersArray = [];
        for await (const { object } of schedulers) {
          schedulersArray.push(object);
        }
        console.log("schedulersArray", schedulersArray);
        for (let i = 0; i < schedulersArray.length; i++) {
          if (schedulersArray[i].url == this.schedulerObject.url) {
            this.index = i;
            console.log(i);
            break;
          }

          // await this.$graffiti.delete(schedulersArray[i].url, this.$graffitiSession.value);
        }

        this.getAllAvailability();
        // // get any availabilities
        // const availabilities = this.$graffiti.discover(
        //   [this.schedulerObject.url], // channels
        //   this.availabilitySchema // schema
        // );
        // let availabilitiesArray = [];
        // for await (const { object } of availabilities) {
        //   availabilitiesArray.push(object);
        // }
        // console.log(availabilitiesArray);

        // let max = 1;
        // // set up allAvailabilities
        // Object.keys(availabilitiesArray[0].value.availability).map(col => {
        //   this.allAvailability[col] = {
        //     date: availabilitiesArray[0].value.availability[col]["date"],
        //     hours: {}
        //   };
        //   Object.keys(availabilitiesArray[0].value.availability[col]["hours"]).map(h => this.allAvailability[col]["hours"][h] = {
        //     list: [],
        //     text: "no one",
        //   });
        // });
        // availabilitiesArray.map(a => {
        //   Object.keys(a.value.availability).map(col => {
        //     Object.keys(a.value.availability[col]["hours"]).map(h => {
        //       if (a.value.availability[col]["hours"][h]) {
        //         this.allAvailability[col]["hours"][h]["list"].push(a.value.username);
        //         const currentText = this.allAvailability[col]["hours"][h]["text"];
        //         this.allAvailability[col]["hours"][h]["text"] = currentText == "no one" ? a.value.username : currentText + ", " + a.value.username;
        //         max = Math.max(max, this.allAvailability[col]["hours"][h]["list"].length + 1);
        //       }
        //     });
        //   });
        // });

        // // set up colors;
        // for (let i = 1; i < max; i++) {
        //   this.colors.push("rgba(141, 189, 231, " + 2/3 * (i + 1) / max + ")");
        // }

        const comparativeST = new Date((new Date(this.startDate)).getTime() + this.offset);
        const comparativeET = new Date((new Date(this.endDate)).getTime() + this.offset);
        const schedulerGrid = document.querySelectorAll('.sentSchedulerGrid .individual-scheduler')[this.index];

        // Set rows & columns
        const numRows = this.endTime - this.startTime;
        const numCols = (comparativeET - comparativeST) / (1000 * 60 * 60 * 24) + 1;

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
        const dateLabels = document.querySelectorAll('.sentSchedulerGrid .dateLabels')[this.index];
        dateLabels.style.gridTemplateColumns = `repeat(${numCols}, 50px)`;
        let current = comparativeST;
        for (let i = 0; i < numCols; i++) {
          const label = document.createElement('h3');
          label.textContent = this.getDateString(current);
          this.availability[i + 1] = {
            date: current,
            hours: {}
          };
          dateLabels.appendChild(label);
          current = this.getNextDate(current);
        }

        // Add time labels
        const timeLabels = document.querySelectorAll('.sentSchedulerGrid .timeLabels')[this.index];
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
            schedulerGrid.querySelectorAll('.grid-cell').forEach(cell => {
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

      async saveAvailability() {
        let cellCount = 1;
        const divisor = Object.keys(this.availability).length;
        document.querySelectorAll('.sentSchedulerGrid .individual-scheduler')[this.index].querySelectorAll('.grid-cell').forEach(cell => {
          const rowNum = cellCount % divisor == 0 ? divisor : cellCount % divisor;
          this.availability[rowNum]["hours"][this.startTime + Math.floor((cellCount - 1) / divisor)] = cell.classList.contains('selected');
          cellCount++;
        });
        console.log("availability", this.availability);

        // put availability object in scheduler channel
        const availabilities = this.$graffiti.discover(
          // channels
          [this.schedulerObject.url],
          // schema
          this.availabilitySchema
        );
        const availabilitiesArray = [];
        for await (const { object } of availabilities) {
          availabilitiesArray.push(object);
        }
        // const availability = availabilitiesArray.filter(a => a.actor == this.$graffitiSession.value.actor)[0];
        console.log("all availabilities", availabilitiesArray);
        const availability = availabilitiesArray.filter(a => a.actor == this.$graffitiSession.value.actor)[0];
        console.log("user's saved availability", availability);

        if (availability) {
          const patch = {
            value: [
              { "op": "replace", "path": "/lastEdited", "value": Date.now() },
              { "op": "replace", "path": "/availability", "value": this.availability },
            ],
          }

          await this.$graffiti.patch(
            patch,
            availability,
            this.$graffitiSession.value,
          );
          console.log("availability patched");
        } else {
          console.log(this.username);
          console.log(this.schedulerObject.url);
          const temp = await this.$graffiti.put(
            {
              channels: [this.schedulerObject.url],
              value: {
                activity: 'FillScheduler',
                target: "Scheduler",
                username: this.username,
                availability: this.availability,
                created: Date.now(),
                lastEdited: Date.now(),
              }
            },
            this.$graffitiSession.value,
          );
          const actual = await this.$graffiti.get(temp.url, {});
          console.log(actual);
          console.log("availability put");
        }

        await this.getAllAvailability();
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

      resetUserAvailability() {
        document.querySelectorAll('.sentSchedulerGrid .individual-scheduler')[this.index].querySelectorAll('.grid-cell').forEach(cell => {
          cell.classList.remove('selected');
        });
      },

      async getAllAvailability() {
        // get any availabilities
        const availabilities = this.$graffiti.discover(
          [this.schedulerObject.url], // channels
          this.availabilitySchema // schema
        );
        let availabilitiesArray = [];
        for await (const { object } of availabilities) {
          availabilitiesArray.push(object);
        }
        console.log("availabilities for scheduler " + this.index, availabilitiesArray);

        let max = 1;
        // set up allAvailabilities
        Object.keys(availabilitiesArray[0].value.availability).map(col => {
          this.allAvailability[col] = {
            date: availabilitiesArray[0].value.availability[col]["date"],
            hours: {}
          };
          Object.keys(availabilitiesArray[0].value.availability[col]["hours"]).map(h => {
            if (h != this.endTime) {
              this.allAvailability[col]["hours"][h] = {
                list: [],
                text: "no one",
              }
            }
          });
        });
        availabilitiesArray.map(a => {
          Object.keys(a.value.availability).map(col => {
            Object.keys(a.value.availability[col]["hours"]).map(h => {
              if (a.value.availability[col]["hours"][h]) {
                this.allAvailability[col]["hours"][h]["list"].push(a.value.username);
                const currentText = this.allAvailability[col]["hours"][h]["text"];
                this.allAvailability[col]["hours"][h]["text"] = currentText == "no one" ? a.value.username : currentText + ", " + a.value.username;
                max = Math.max(max, this.allAvailability[col]["hours"][h]["list"].length + 1);
              }
            });
          });
        });

        // set up colors;
        this.colors = ["oklch(0.94 0.0197 17.51)"];
        for (let i = 1; i < max; i++) {
          this.colors.push("rgba(" + this.rgb + ", " + 3 / 4 * (i + 1) / max + ")");
        }

        const schedulerGrid = document.querySelectorAll('.sentSchedulerGrid .individual-scheduler')[this.index];

        let cellCount = 0;
        const comparativeST = new Date((new Date(this.startDate)).getTime() + this.offset);
        const comparativeET = new Date((new Date(this.endDate)).getTime() + this.offset);
        const numCols = (comparativeET - comparativeST) / (1000 * 60 * 60 * 24) + 1;
        schedulerGrid.querySelectorAll('.grid-cell').forEach(cell => {
          // set color of cell
          const r = (cellCount + 1) % numCols == 0 ? numCols : (cellCount + 1) % numCols;
          // console.log(this.allAvailability[r]);
          // console.log(parseInt(this.startTime) + Math.floor((cellCount) / numCols));
          const numPeople = this.allAvailability[r]["hours"][parseInt(this.startTime) + Math.floor((cellCount) / numCols)]["list"].length;
          // console.log(this.colors[numPeople]);
          cell.style.backgroundColor = this.colors[numPeople];
          cell.title = "available: " + this.allAvailability[r]["hours"][parseInt(this.startTime) + Math.floor((cellCount) / numCols)]["text"];
          cellCount++;
        });
      }
    },

    template: await fetch("./Components/scheduler.html").then((r) => r.text()),
  };
}  