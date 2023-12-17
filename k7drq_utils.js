// Some variables for within the QSOs
const greetings = ["GM", "GA", "GE"];
const RSTs = ["359", "559", "579", "599", "5NN"];
const WX = ["SUNNY", "CLOUDY", "RAINING", "WINDY", "FOGGY", "CLEAR", "PARTLY CLOUDY"];
const rigs = [
    "KX2", "KX3", "FT 857D", "FT 817ND", "FT 991A", "FT 450D", "FT 891", "IC 705",
    "IC 7100", "IC 7300", "IC 7610", "XIEGU X6100", "TS 990S", "TS 590SG", "TS 890S"
];
const antennas = [
    "EFHW", "DIPOLE", "VERTICAL", "LOOP", "RANDOM WIRE", "LONG WIRE", "WINDOM", "SLOPER",
    "INVERTED V", "INVERTED L", "DELTA LOOP", "QUAD", "YAGI", "BEAM", "MAGNETIC LOOP", "G5RV",
]
const powers = ["5", "10", "20", "25", "50", "100", "250", "500"];
const heights = ["15", "20", "25", "30", "40", "50", "60", "80"];
const occupations = [
    "TEACHER", "ENGINEER", "DOCTOR", "NURSE", "POLICE OFFICER", "FIRE FIGHTER", "PILOT",
    "TRUCK DRIVER", "MECHANIC", "CHEF", "CLERK", "PROFESSOR", "SCIENTIST", "WRITER",
    "JOURNALIST", "TRAINER", "MECHANIC", "ELECTRICIAN", "PLUMBER", "CARPENTER", "FARMER"
];


// Generate a random US ham radio callsign
function generateRandomUSCallsign() {
    const validFirstLetters = ['A', 'K', 'N', 'W'];
    const firstLetter = validFirstLetters[Math.floor(Math.random() * validFirstLetters.length)];
    let prefix = firstLetter;

    // Determine whether to include the second letter or not
    if (Math.random() > 0.5) {
        prefix += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random letter (A-Z)
    }

    const digit = Math.floor(Math.random() * 10); // Random number between 0 and 9

    let suffix = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const suffixLength = Math.floor(Math.random() * 3) + 1; // Random suffix length between 1 and 3
    for (let i = 0; i < suffixLength; i++) {
        suffix += letters.charAt(Math.floor(Math.random() * letters.length)); // Random letter
    }

    var callsign = `${prefix}${digit}${suffix}`

    // If the call is only three characters, add a final one
    if (callsign.length === 3) {
        callsign += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    return callsign
}


// Load names
async function loadNames() {
    try {
        const response = await fetch('assets/first_names.txt');
        const data = await response.text();
        return data.split('\n');
    } catch (error) {
        console.error('Error fetching or processing first_names.txt:', error);
    }
}


// Load cities
async function loadCities() {
    try {
        const response = await fetch('assets/us_cities.txt');
        const data = await response.text();
        return data.split('\n');
    } catch (error) {
        console.error('Error fetching or processing us_cities.txt:', error);
    }
}


// Load only states from the US Cities file
async function loadStates() {
    try {
        const response = await fetch('assets/us_cities.txt');
        const data = await response.text();
        const cities = data.split('\n');
        const states = [];
        cities.forEach(city => {
            const state = city.split(',')[1].trim();
            if (!states.includes(state) && state !== '') {
                states.push(state);
            }
        });
        return states;
    } catch (error) {
        console.error('Error fetching or processing us_cities.txt:', error);
    }
}


// Load LICW QSO protocol information from JSON files
async function loadProtocols() {

    const protocolFiles = [
        'assets/protocol1.json',
        'assets/protocol2.json',
        'assets/protocol3.json',
        'assets/protocol4.json'
    ];

    try {
        const protocolData = await Promise.all(protocolFiles.map(async (file, index) => {
            const response = await fetch(file);
            return { [`protocol${index + 1}`]: await response.json() };
        }));

        // Combine data into a single object
        var allProtocols = Object.assign({}, ...protocolData);

        // Create a protocol for minimum and full QSOs
        allProtocols["minimalQSO"] = {
            "Participant": allProtocols["protocol1"]["Participant"].concat(allProtocols["protocol4"]["Participant"]),
            "Lines": allProtocols["protocol1"]["Lines"].concat(allProtocols["protocol4"]["Lines"]),
            "Instructions": allProtocols["protocol1"]["Instructions"].concat(allProtocols["protocol4"]["Instructions"])
        }
        allProtocols["fullQSO"] = {
            "Participant": (
                allProtocols["protocol1"]["Participant"]
                    .concat(allProtocols["protocol2"]["Participant"])
                    .concat(allProtocols["protocol3"]["Participant"])
                    .concat(allProtocols["protocol4"]["Participant"])
            ),
            "Lines": (
                allProtocols["protocol1"]["Lines"]
                    .concat(allProtocols["protocol2"]["Lines"])
                    .concat(allProtocols["protocol3"]["Lines"])
                    .concat(allProtocols["protocol4"]["Lines"])
            ),
            "Instructions": (
                allProtocols["protocol1"]["Instructions"]
                    .concat(allProtocols["protocol2"]["Instructions"])
                    .concat(allProtocols["protocol3"]["Instructions"])
                    .concat(allProtocols["protocol4"]["Instructions"])
            )
        }
    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }

    return allProtocols;
}


// Load contest protocol information from JSON files
async function loadContestProtocols() {

    const protocolFiles = [
        "assets/licw_challenge.json",
        "assets/skcc_wes.json",
        "assets/k1usn_sst.json",
        "assets/sota.json"
    ];

    try {
        const protocolData = await Promise.all(protocolFiles.map(async (file, index) => {
            const response = await fetch(file);
            const filename = file.split('/').pop().split('.')[0];
            return { [filename]: await response.json() };
        }));

        // Combine data into a single object
        var allProtocols = Object.assign({}, ...protocolData);

    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }

    return allProtocols;
}


// Add styles to the line rows for the QSO generators
function styleLineRow(row, participant, line) {
    row.classList.add('lineRow');

    if (withInstructions) {
        line += '<br /><br />'
    }

    if (participant === 'CQ') {
        row.classList.add('lineRowCQ');
        row.insertCell().innerHTML = line;
        row.insertCell();
    } else if (participant === 'CALLER') {
        row.classList.add('lineRowCaller');
        row.insertCell();
        row.insertCell().innerHTML = line;
    }

}


// Add styles to the instructions rows for the QSO generators
function styleInstructionsRow(row, participant, instructions) {
    row.classList.add('instructionsRow');

    if (participant === 'CQ') {
        row.insertCell().textContent = instructions;
        row.insertCell().textContent = '';
    } else if (participant === 'CALLER') {

        row.insertCell().textContent = '';
        row.insertCell().textContent = instructions;
    }
}