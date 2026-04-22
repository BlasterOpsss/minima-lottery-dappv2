// ===============================
// ⚙ CONFIG (USE SCRIPT ADDRESS)
// ===============================
const LOTTERY_ADDRESS = "0xFFEEDDFFEEDD99"; // ✅ IMPORTANT
const TICKET_PRICE = "0.0000001";

let entries = [];


// ===============================
// 🔌 INIT MINIMASK
// ===============================
window.onload = function () {

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            console.log("MiniMask:", msg);

            // ✅ On load
            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data.data.loggedon) {
                    document.getElementById("walletStatus").innerText = "❌ Not logged in";
                    alert("Please login to MiniMask");
                    return;
                }

                document.getElementById("walletStatus").innerText = "✅ Connected";

                loadEntries(); // 🔄 load tickets
            }

            // ✅ After transaction approval
            if (msg.event === "MINIMASK_PENDING") {

                console.log("Pending:", msg.data);

                if (msg.data.response && msg.data.response.status) {
                    alert("✅ Transaction confirmed!");
                    loadEntries(); // refresh entries
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

            console.log("Send response:", resp);

            if (resp.pending) {
                alert("🎟 Ticket created! Approve in MiniMask");
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

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        console.log("Entries:", resp);

        entries = [];
        let html = "";

        if (!resp.data || resp.data.length === 0) {
            html = "<li>No entries yet</li>";
        }

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
