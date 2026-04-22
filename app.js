// ===============================
const LOTTERY_ADDRESS = "0xFFEEDDFFEEDD99";
const TICKET_PRICE = 0.0000001;
const MAX_TICKETS = 5;

let entries = [];
let CURRENT_ROUND = 1;
let DRAW_LOCKED = false;


// INIT
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
                    loadEntries();
                }
            }
        });
    }
};


// BUY
function buyTicket() {

    MINIMASK.account.getAddress(function (res) {

        if (!res.status) return;

        const wallet = res.data;
        const time = new Date().toLocaleString();

        const state = {};
        state[99] = `${wallet}|${time}|${CURRENT_ROUND}`;

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


// LOAD
function loadEntries() {

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        entries = [];
        let walletCounts = {};
        let html = "";

        if (!resp.data) return;

        for (let coin of resp.data) {

            if (!coin.state || !coin.state[99]) continue;

            const raw = decodeURI(coin.state[99]);
            const parts = raw.split("|");

            if (parts.length < 3) continue;

            const wallet = parts[0];
            const time = parts[1];
            const round = parseInt(parts[2]);

            if (round !== CURRENT_ROUND) continue;

            entries.push({ wallet, time });

            walletCounts[wallet] = (walletCounts[wallet] || 0) + 1;

            html += `<li><b>${short(wallet)}</b><br><small>${time}</small></li>`;
        }

        document.getElementById("entries").innerHTML = html;
        document.getElementById("entryCount").innerText = entries.length;
        document.getElementById("round").innerText = CURRENT_ROUND;

        updateLeaderboard(walletCounts);
        updateStats(walletCounts);
        updatePool();

        if (entries.length >= MAX_TICKETS && !DRAW_LOCKED) {
            DRAW_LOCKED = true;
            setTimeout(drawWinner, 1000);
        }
    });
}


// FAIR WINNER
function drawWinner() {

    if (entries.length === 0) return;

    const seed = "ROUND_" + CURRENT_ROUND;
    const hash = simpleHash(seed);
    const index = hash % entries.length;

    const winner = entries[index];

    showWinner(winner.wallet);
    payout(winner.wallet);

    CURRENT_ROUND++;
    DRAW_LOCKED = false;

    setTimeout(loadEntries, 3000);
}


// HASH
function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}


// PAYOUT
function payout(wallet) {

    const pool = entries.length * TICKET_PRICE;

    MINIMASK.account.send(
        pool,
        wallet,
        "0x00",
        { payout: true },
        function (resp) {
            if (resp.pending) alert("Approve payout");
        }
    );
}


// UI
function showWinner(wallet) {

    document.getElementById("winnerBox").style.display = "block";
    document.getElementById("winner").innerHTML =
        "🏆 Winner<br><b>" + short(wallet) + "</b>";

    confetti();
}


// POOL
function updatePool() {
    const pool = entries.length * TICKET_PRICE;
    document.getElementById("prizePool").innerText =
        pool.toFixed(8) + " MINIMA";
}


// LEADERBOARD
function updateLeaderboard(counts) {

    let sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]);

    let html = "";

    sorted.forEach((w, i) => {
        html += `<li>${i+1}. ${short(w[0])} → ${w[1]}</li>`;
    });

    document.getElementById("leaderboard").innerHTML = html;
}


// STATS
function updateStats(counts) {

    MINIMASK.account.getAddress(function (res) {

        if (!res.status) return;

        const c = counts[res.data] || 0;

        document.getElementById("yourStats").innerText =
            short(res.data) + " → " + c + " tickets";
    });
}


// HELPERS
function short(addr) {
    return addr.slice(0,6) + "..." + addr.slice(-4);
}


// CONFETTI
function confetti() {
    for (let i=0;i<15;i++){
        let e=document.createElement("div");
        e.innerText="🎉";
        e.style.position="fixed";
        e.style.left=Math.random()*100+"vw";
        e.style.top="-20px";
        document.body.appendChild(e);
        let t=setInterval(()=>e.style.top=(e.offsetTop+5)+"px",30);
        setTimeout(()=>{clearInterval(t);e.remove()},2000);
    }
}


// AUTO REFRESH
setInterval(loadEntries, 10000);
