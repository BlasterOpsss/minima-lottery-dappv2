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

                if (!msg.data.data.loggedon) {
                    document.getElementById("walletStatus").innerText = "❌ Not logged in";
                    return;
                }

                document.getElementById("walletStatus").innerText = "✅ Connected";

                loadEntries();
            }

            if (msg.event === "MINIMASK_PENDING") {

                if (msg.data.response && msg.data.response.status) {
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

        const wallet = res.data;
        const time = new Date().toLocaleString();

        const state = {};
        state[99] = wallet + "|" + time; // important

        console.log("Sending from wallet:", wallet);

        MINIMASK.account.send(
            TICKET_PRICE,
            LOTTERY_ADDRESS,
            "0x00",
            state,
            function (resp) {

                if (resp.pending) {
                    alert("Approve transaction in MiniMask");
                } else {
                    console.log("Error:", resp);
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
            return;
        }

        for (let coin of resp.data) {

            console.log("COIN:", coin);

            if (!coin.state) continue;

            // 🔥 KEY FIX: read ALL state keys
            for (let key in coin.state) {

                let raw = coin.state[key];

                if (!raw) continue;

                try {
                    raw = decodeURI(raw);
                } catch (e) {}

                console.log("STATE VALUE:", raw);

                const parts = raw.split("|");

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

        console.log("FINAL ENTRIES:", entries);

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

        const wallet = res.data;

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
// 🔄 AUTO REFRESH
// ===============================
setInterval(loadEntries, 10000);
