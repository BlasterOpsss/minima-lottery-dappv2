// ===============================
// ⚙ CONFIG
// ===============================
const LOTTERY_ADDRESS = "0xA7F3C9B2E8D641";
const TICKET_PRICE = 0.0000001;

let entries = [];


// ===============================
// 🔌 INIT
// ===============================
window.onload = function () {

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            console.log("MiniMask:", msg);

            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data || !msg.data.data || !msg.data.data.loggedon) {
                    document.getElementById("walletStatus").innerText = "❌ Not logged in";
                    return;
                }

                document.getElementById("walletStatus").innerText = "✅ Connected";

                loadEntries();
            }

            if (msg.event === "MINIMASK_PENDING") {

                if (msg.data && msg.data.response && msg.data.response.status) {
                    console.log("Transaction confirmed");
                    setTimeout(loadEntries, 6000);
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

    MINIMASK.account.getAddress(function (res) {

        if (!res || !res.status) {
            alert("Login to MiniMask first");
            return;
        }

        const wallet = String(res.data || "");
        const time = new Date().toLocaleString();

        const state = {};
        state[99] = wallet + "|" + time;

        console.log("Sending from:", wallet);

        MINIMASK.account.send(
            TICKET_PRICE,
            LOTTERY_ADDRESS,
            "0x00",
            state,
            function (resp) {

                console.log("Send response:", resp);

                if (resp.pending) {
                    alert("Approve transaction in MiniMask");
                } else {
                    alert("Error: " + (resp.error || "Unknown"));
                }
            }
        );
    });
}



// ===============================
// 📥 LOAD ENTRIES (FIXED)
// ===============================
function loadEntries() {

    console.log("🔄 Loading entries from:", LOTTERY_ADDRESS);

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        console.log("RAW RESPONSE:", resp);

        let html = "";
        entries = [];

        if (!resp || !resp.data || resp.data.length === 0) {
            document.getElementById("entries").innerHTML = "<li>No entries yet</li>";
            document.getElementById("entryCount").innerText = 0;
            updateStats();
            updatePool();
            return;
        }

        for (let coin of resp.data) {

            if (!coin || !coin.state) continue;

            // 🔥 Read all state values
            for (let key in coin.state) {

                let raw = coin.state[key];

                if (!raw) continue;

                try {
                    raw = decodeURI(raw);
                } catch (e) {}

                const parts = String(raw).split("|");

                if (parts.length >= 2) {

                    const wallet = parts[0].trim();
                    const time = parts[1].trim();

                    entries.push({ wallet, time });

                    html += `
                        <li>
                            🎟 Ticket<br>
                            <small>${time}</small>
                        </li>
                    `;
                }
            }
        }

        document.getElementById("entries").innerHTML =
            html || "<li>No valid entries found</li>";

        document.getElementById("entryCount").innerText = entries.length;

        updateStats();
        updatePool();
    });
}



// ===============================
// 📊 YOUR STATS
// ===============================
function updateStats() {

    MINIMASK.account.getAddress(function (res) {

        if (!res || !res.status) {
            document.getElementById("yourStats").innerText = "Not connected";
            return;
        }

        const wallet = String(res.data || "");

        let count = 0;

        for (let e of entries) {
            if (e.wallet === wallet) count++;
        }

        document.getElementById("yourStats").innerText =
            "Your Tickets: " + count;
    });
}



// ===============================
// 💰 PRIZE POOL
// ===============================
function updatePool() {

    const pool = entries.length * TICKET_PRICE;

    document.getElementById("prizePool").innerText =
        pool.toFixed(8) + " MINIMA";
}



// ===============================
// 🔧 SAFE SHORT FUNCTION (FIXED)
// ===============================
function short(addr) {
    if (!addr || typeof addr !== "string") return "???";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}



// ===============================
// 🚫 DISABLED DRAW WINNER (NO ERROR)
// ===============================
function drawWinner() {
    console.log("Draw winner disabled");
}



// ===============================
// 🔄 AUTO REFRESH
// ===============================
setInterval(loadEntries, 10000);
