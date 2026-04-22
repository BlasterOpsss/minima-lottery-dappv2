// ===============================
// ⚙ CONFIG
// ===============================
const LOTTERY_ADDRESS = "MxG086HDR94WWW3ZJE24E807D5SQ7F5WUDQFNN9N221P89D698ZET9YK8832YJQ";
const TICKET_PRICE = "0.0000001";

let entries = [];


// ===============================
// 🔌 INIT MINIMASK
// ===============================
window.onload = function () {

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            console.log("MiniMask:", msg);

            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data.data.loggedon) {
                    document.getElementById("walletStatus").innerText = "❌ Not logged in";
                    alert("Please login to MiniMask");
                    return;
                }

                document.getElementById("walletStatus").innerText = "✅ Connected";

                loadEntries();
            }

            if (msg.event === "MINIMASK_PENDING") {

                console.log("Pending:", msg.data);

                if (msg.data.response && msg.data.response.status) {
                    alert("✅ Transaction confirmed!");
                    loadEntries();
                } else {
                    alert("❌ Transaction failed");
                }
            }

        });

    } else {
        document.getElementById("walletStatus").innerText = "❌ MiniMask not found";
    }
};


// ===============================
// 🎟 BUY TICKET
// ===============================
function buyTicket() {

    const state = {};
    state[1] = "ticket_" + Date.now();

    MINIMASK.account.send(
        TICKET_PRICE,
        LOTTERY_ADDRESS,
        "0x00",
        state,
        function (resp) {

            console.log("Response:", resp);

            if (resp.pending) {
                alert("🎟 Ticket sent! Approve in MiniMask");
            } else {
                alert("❌ Error: " + resp.error);
            }
        }
    );
}


// ===============================
// 📥 LOAD ENTRIES
// ===============================
function loadEntries() {

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "", "", function (resp) {

        console.log("Entries:", resp);

        entries = [];

        let html = "";

        for (let i = 0; i < resp.data.length; i++) {

            const coin = resp.data[i];

            if (coin.state && coin.state[1]) {

                const entry = coin.state[1];

                entries.push(entry);

                html += "<li>" + entry + "</li>";
            }
        }

        document.getElementById("entries").innerHTML = html;
        document.getElementById("entryCount").innerText = entries.length;
    });
}


// ===============================
// 🎯 DRAW WINNER
// ===============================
function drawWinner() {

    if (entries.length === 0) {
        alert("No entries yet!");
        return;
    }

    const winner = entries[Math.floor(Math.random() * entries.length)];

    document.getElementById("winnerImg").style.display = "block";

    document.getElementById("winner").innerHTML =
        "🏆 Winner: <b>" + winner + "</b>";
}
