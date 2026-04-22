const LOTTERY_ADDRESS = "0xA7F3C9B2E8D641";
const TICKET_PRICE = 0.0000001;

let entries = [];

// ===============================
// GET WALLET SAFELY
// ===============================
function getWalletAddress(res) {
    if (!res || !res.status) return null;
    const d = res.data;

    if (typeof d === "string") return d;
    if (typeof d === "object") return d.address || d.data;

    return null;
}


// ===============================
// INIT
// ===============================
window.onload = function () {

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data.data.loggedon) {
                    walletStatus.innerText = "❌ Not logged in";
                    return;
                }

                walletStatus.innerText = "✅ Connected";

                loadEntries();
            }

            if (msg.event === "MINIMASK_PENDING") {
                setTimeout(loadEntries, 6000);
            }
        });

    }
};


// ===============================
// BUY TICKET
// ===============================
function buyTicket() {

    MINIMASK.account.getAddress(function (res) {

        const wallet = getWalletAddress(res);
        if (!wallet) return alert("Wallet error");

        const time = new Date().toLocaleString();

        const state = {};
        state[99] = wallet + "|" + time;

        MINIMASK.account.send(
            TICKET_PRICE,
            LOTTERY_ADDRESS,
            "0x00",
            state,
            function (resp) {
                if (resp.pending) alert("Approve transaction");
            }
        );
    });
}


// ===============================
// LOAD ENTRIES
// ===============================
function loadEntries() {

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        entries = [];
        let html = "";

        if (!resp || !resp.data) return;

        MINIMASK.account.getAddress(function(res){

            const myWallet = getWalletAddress(res);

            for (let coin of resp.data) {

                if (!coin.state) continue;

                for (let key in coin.state) {

                    let raw = coin.state[key];

                    try { raw = decodeURI(raw); } catch {}

                    const parts = raw.split("|");

                    if (parts.length >= 2) {

                        const wallet = parts[0];
                        const time = parts[1];

                        entries.push({ wallet, time });

                        const isMine = wallet === myWallet;

                        html += `
                        <li class="${isMine ? "mine" : ""}">
                            🎟 Ticket<br>
                            <small>${time}</small>
                        </li>`;
                    }
                }
            }

            entriesList.innerHTML = html || "<li>No entries</li>";
            entryCount.innerText = entries.length;

            updateStats(myWallet);
            updatePool();
        });
    });
}


// ===============================
// STATS
// ===============================
function updateStats(myWallet) {

    let count = 0;

    for (let e of entries) {
        if (e.wallet === myWallet) count++;
    }

    yourStats.innerText = "Your Tickets: " + count;
}


// ===============================
// POOL
// ===============================
function updatePool() {

    const pool = entries.length * TICKET_PRICE;

    prizePool.innerText = pool.toFixed(8) + " MINIMA";
}


// ===============================
// TIMER (3 DAYS)
// ===============================
const ROUND_DURATION = 3 * 24 * 60 * 60 * 1000;
let startTime = Date.now();

function updateTimer() {

    const diff = ROUND_DURATION - (Date.now() - startTime);

    if (diff <= 0) {
        startTime = Date.now();
        showWinner();
        return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    timer.innerText =
        `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

setInterval(updateTimer, 1000);


// ===============================
// WINNER POPUP
// ===============================
function showWinner() {

    if (entries.length === 0) return;

    winnerText.innerText = "Winner selected 🎉";

    winnerPopup.classList.remove("hidden");

    setTimeout(() => {
        winnerPopup.classList.add("hidden");
    }, 4000);
}


// ===============================
// LIVE UPDATE
// ===============================
setInterval(loadEntries, 8000);
