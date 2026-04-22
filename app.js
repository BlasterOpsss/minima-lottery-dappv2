// ===============================
// ⚙ CONFIG
// ===============================
const LOTTERY_ADDRESS = "0xFFEEDDFFEEDD99"; // ✅ required
const TICKET_PRICE = "0.0000001";

let entries = [];


// ===============================
// 🔌 INIT MINIMASK
// ===============================
window.onload = function () {

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            console.log("MiniMask:", msg);

            // ✅ INIT
            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data.data.loggedon) {
                    document.getElementById("walletStatus").innerText = "❌ Not logged in";
                    alert("Open inside MiniMask browser & login");
                    return;
                }

                document.getElementById("walletStatus").innerText = "✅ Connected";

                loadEntries();
            }

            // ✅ TRANSACTION RESULT
            if (msg.event === "MINIMASK_PENDING") {

                console.log("Pending update:", msg.data);

                if (msg.data.response && msg.data.response.status) {
                    alert("✅ Transaction confirmed!");
                    loadEntries();
                } else {
                    console.log("Waiting for confirmation...");
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
    state[99] = "ticket_" + Date.now(); // ✅ IMPORTANT FIX

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

    console.log("🔄 Loading entries...");

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        console.log("Entries response:", resp);

        entries = [];
        let html = "";

        if (!resp || !resp.data || resp.data.length === 0) {
            html = "<li>No entries yet</li>";
        }

        for (let i = 0; i < resp.data.length; i++) {

            const coin = resp.data[i];

            console.log("Coin:", coin);

            if (coin.state && coin.state[99]) {

                const entry = coin.state[99];

                entries.push(entry);

                html += "<li>" + entry + "</li>";
            }
        }

        document.getElementById("entries").innerHTML = html;
        document.getElementById("entryCount").innerText = entries.length;
    });
}



// ===============================
// 🔄 AUTO REFRESH (CRITICAL)
// ===============================
setInterval(() => {
    loadEntries();
}, 10000); // every 10 sec



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
