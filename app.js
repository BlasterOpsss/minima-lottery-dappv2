// ===============================
// ⚙ CONFIG
// ===============================
const LOTTERY_ADDRESS = "0xFFEEDDFFEEDD99";
const TICKET_PRICE = 0.0000001;

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
                    return;
                }

                document.getElementById("walletStatus").innerText = "✅ Connected";

                loadEntries();
            }

            if (msg.event === "MINIMASK_PENDING") {

                if (msg.data.response && msg.data.response.status) {
                    console.log("Transaction confirmed");
                    setTimeout(loadEntries, 6000); // wait for chain update
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
        state[99] = wallet + "|" + time; // ✅ store wallet

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
// 📥 LOAD ENTRIES
// ===============================
function loadEntries() {

    console.log("🔄 Loading entries...");

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        console.log("RAW COINS:", resp);

        entries = [];
        let walletCounts = {};
        let html = "";

        if (!resp || !resp.data) {
            console.log("No data returned");
            return;
        }

        for (let coin of resp.data) {

            if (!coin.state || !coin.state[99]) continue;

            let raw = coin.state[99];

            try {
                raw = decodeURI(raw);
            } catch (e) {}

            console.log("STATE:", raw);

            const parts = raw.split("|");

            if (parts.length < 2) continue;

            const wallet = parts[0].trim();
            const time = parts[1].trim();

            console.log("Parsed wallet:", wallet);

            entries.push({ wallet, time });

            // leaderboard count
            walletCounts[wallet] = (walletCounts[wallet] || 0) + 1;

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

        updateLeaderboard(walletCounts);
        updateStats(walletCounts);
        updatePool();
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
// 🏆 LEADERBOARD
// ===============================
function updateLeaderboard(counts) {

    let sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]);

    let html = "";

    sorted.forEach((w, i) => {
        html += `<li>${i + 1}. ${short(w[0])} → ${w[1]} 🎟</li>`;
    });

    document.getElementById("leaderboard").innerHTML =
        html || "<li>No data</li>";
}



// ===============================
// 📊 YOUR STATS
// ===============================
function updateStats(counts) {

    MINIMASK.account.getAddress(function (res) {

        if (!res || !res.status) {
            document.getElementById("yourStats").innerText = "Not connected";
            return;
        }

        const wallet = res.data;

        const count = counts[wallet] || 0;

        document.getElementById("yourStats").innerText =
            short(wallet) + " → " + count + " tickets";
    });
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
