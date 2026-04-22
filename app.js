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
        state[99] = wallet + "|" + time;

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
// 📥 LOAD ENTRIES
// ===============================
function loadEntries() {

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        entries = [];
        let html = "";

        if (!resp || !resp.data) {
            document.getElementById("entries").innerHTML = "<li>No data</li>";
            return;
        }

        for (let coin of resp.data) {

            if (!coin.state || !coin.state[99]) continue;

            let raw = coin.state[99];

            try {
                raw = decodeURI(raw);
            } catch (e) {}

            const parts = raw.split("|");

            if (parts.length < 2) continue;

            const wallet = parts[0].trim();
            const time = parts[1].trim();

            entries.push({ wallet, time });

            html += `
                <li>
                    <b>${short(wallet)}</b><br>
                    <small>${time}</small>
                </li>
            `;
        }

        document.getElementById("entries").innerHTML =
            html || "<li>No entries yet</li>";

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
            short(wallet) + " → " + count + " tickets";
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
// 🔧 HELPERS
// ===============================
function short(addr) {
    if (!addr) return "???";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}



// ===============================
// 🔄 AUTO REFRESH
// ===============================
setInterval(loadEntries, 10000);
