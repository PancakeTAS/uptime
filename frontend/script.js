// html elements

/**
 * create the html body
 * 
 * @param {object[]} servers list of servers
 */
function create_body({ servers }) {
    const is_fully_operational = servers.filter(x => x.is_operational != 2).length == 0;
    const icon = is_fully_operational ? `
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M40 80C62.0914 80 80 62.0914 80 40C80 17.9086 62.0914 0 40 0C17.9086 0 0 17.9086 0 40C0 62.0914 17.9086 80 40 80Z" fill="#28A745"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M58.0607 28.9393C58.6464 29.5251 58.6464 30.4749 58.0607 31.0607L36.0607 53.0607C35.4749 53.6464 34.5251 53.6464 33.9393 53.0607L23.9393 43.0607C23.3536 42.4749 23.3536 41.5251 23.9393 40.9393C24.5251 40.3536 25.4749 40.3536 26.0607 40.9393L35 49.8787L55.9393 28.9393C56.5251 28.3536 57.4749 28.3536 58.0607 28.9393Z" fill="white"/>
        </svg>` : `
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M40 80C62.0914 80 80 62.0914 80 40C80 17.9086 62.0914 0 40 0C17.9086 0 0 17.9086 0 40C0 62.0914 17.9086 80 40 80Z" fill="#CB4C48"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M52.5607 29.5607C53.1464 28.9749 53.1464 28.0251 52.5607 27.4393C51.9749 26.8536 51.0251 26.8536 50.4393 27.4393L40 37.8787L29.5607 27.4393C28.9749 26.8536 28.0251 26.8536 27.4393 27.4393C26.8536 28.0251 26.8536 28.9749 27.4393 29.5607L37.8787 40L26.4393 51.4393C25.8536 52.0251 25.8536 52.9749 26.4393 53.5607C27.0251 54.1464 27.9749 54.1464 28.5607 53.5607L40 42.1213L51.4393 53.5607C52.0251 54.1464 52.9749 54.1464 53.5607 53.5607C54.1464 52.9749 54.1464 52.0251 53.5607 51.4393L42.1213 40L52.5607 29.5607Z" fill="white"/>
        </svg>`;
    const title = is_fully_operational ? "Fully Operational" : "Partially Operational";

    return `
        <div class="header" style="width: ${calculate_main_width()}px;">
            <span class="header-left">
                Uptime
            </span>
        </div>
        <div class="summary">${icon} ${title}</div>
        ${servers.map(create_server).join("")}
        <div class="footer" style="width: ${calculate_main_width()}px;">
            <span class="footer-left">
                Uptime
            </span>
            <span class="footer-right">
                Status page powered by <a href="https://github.com/PancakeTAS/uptime">uptime</a>, <small><s>inspired</s> by <a href="https://status.auth0.com/">status.auth0.com</a></small> 
            </span>
        </div>
        `;
}

/**
 * create a server html element
 * 
 * @param {string} name name of the server
 * @param {object} title information about the server
 * @param {int} last_update unix timestamp of the last health check
 * @param {object} summary overall uptime summary
 * @param {object[]} categories list of categories of services
 * @returns {string} html element
 */
function create_server({
    title,
    last_update,
    summary,
    categories
}) {
    return `
        <div class="server" style="width: calc(${calculate_main_width()}px - 12rem);">
            ${create_server_name(title)}
            ${create_server_update(last_update)}
            ${categories.map(create_server_category).join("")}
        </div>`;
}

/**
 * create a name html element
 * 
 * @param {string} name name of the server
 * @param {int} is_operational whether the server is operational
 * @returns {string} html element
 */
function create_server_name({ name, is_operational }) {
    // calculate classes
   const classes = is_operational === 2 ? "" : (is_operational === 1 ? "warning" : "danger");
    // calculate operational status
    const status = is_operational === 2 ?
        "Fully Operational"
        : (is_operational === 1 ? "Partially Operational" : "Not Operational");

    return `
        <div class="server-name ${classes}">
            <span>${name} : ${status}</span>
        </div>`;
}

/**
 * create a latest update html element
 * 
 * @param {string} last_update last update
 * @returns {string} html element
 */
function create_server_update(last_update) {
    // calculate last update date (January 20, 2025, 3:10 UTC)
    const update_date = new Date(last_update * 1000).toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `
        <span class="server-update">
            Last updated: ${update_date} UTC
        </span>`;
}

/**
 * create a category html element
 * 
 * @param {string} name name of the category
 * @param {object[]} services services in the category
 * @returns {string} html element
 */
function create_server_category({ name, services }) {
    return `
        <span class="category">${name}</span>
        ${services.map(create_category_service).join("")}`;
}

/**
 * create a service html element
 * 
 * @param {string} name name of the service
 * @param {string} info information about the service
 * @param {int[]} data_uptimes uptime data per day (0 = up, 1 = partially up, 2 = down)
 * @param {int} status whether the service is up (0 = no, 1 = yes)
 * @returns {string} html element
 */
function create_category_service({ name, info, data_uptimes, status }) {
    // calculate uptime percentage
    const percentage = data_uptimes.filter(x => x === 0).length / data_uptimes.length * 100;
    // fill uptime data with 0s if not enough data, or remove excess data
    const days = calculate_days();
    if (data_uptimes.length < days) {
        data_uptimes = new Array(days - data_uptimes.length).fill(-1).concat(data_uptimes);
    } else if (data_uptimes.length > days) {
        data_uptimes = data_uptimes.slice(-days);
    }
    // calculate optional down class
    const classes = status === 1 ? "" : "down";

    return `
        <div class="service">
            <div class="service-top">
                <span class="service-name ${classes}">${name} ${create_hover(info)}</span>
                <span class="service-uptime ${classes}">${percentage.toFixed(2)}% ${status ? "" : "&middot; <b>Down</b>"}</span>
            </div>
            <div class="service-graph">
                ${data_uptimes.slice(-days).map(create_status).join("")}
            </div>
            <div class="service-bottom">
                <span class="service-range-oldest ${classes}">${data_uptimes.length} days ago</span>
                <span class="service-range-newest ${classes}">Today</span>
            </div>
        </div>`;
}

/**
 * create an information hover html element
 * 
 * @param {string} info information about the service 
 * @returns {string} html element
 */
function create_hover(info) {
    return `<abbr title="${info.replaceAll('"', '')}"><svg style="color: var(--alt-text-color)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-2 text-dark-gray"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></abbr>`;
}

/**
 * create a status html element
 * 
 * @param {int} hours uptime hours
 */
function create_status(hours) {
    if (hours === 0)
        return `<div></div>`;
    else if (hours === 1)
        return `<div class="warning"></div>`;
    else if (hours === -1)
        return `<div class="invalid"></div>`;
    return `<div class="danger"></div>`;
}

// utility functions

/**
 * calculate the maximum width of the server and header element
 * 
 * @returns {int} width in pixels
 */
function calculate_main_width() {
    const WIDTH_MIN = 600;
    const WIDTH_MAX = 1200;
    const WIDTH_INCREMENTS = 300;
    const SCREEN_WIDTH = document.body.clientWidth;
    return  Math.min(
        WIDTH_MAX,
        Math.max(
            WIDTH_MIN,
            Math.floor(SCREEN_WIDTH / WIDTH_INCREMENTS) * WIDTH_INCREMENTS
        )
    );
}

/**
 * calculate the amount of days that fit on the screen
 * 
 * @returns {int} days that fit on the screen
 */
function calculate_days() {
    const DAYS_MIN = 30;
    const DAYS_WIDTH_INCREMENT = 300;
    const DAYS_INCREMENT = 30;
    return (calculate_main_width() / DAYS_WIDTH_INCREMENT * DAYS_INCREMENT) - DAYS_MIN;
}

// main

const TEST_API_RESPONSE = {
    servers: [
        {
            title: {
                name: "MGNetwork",
                is_operational: 2,
            },
            last_update: 0,
            categories: [
                {
                    name: "TAS Battle",
                    services: [
                        {
                            name: "Velocity",
                            info: "Velocity proxy server connecting all minecraft servers on the network",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Lobby",
                            info: "SlowPaper Minecraft server acting as the main tas battle lobby",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Game Server 1",
                            info: "SlowPaper Minecraft server acting as the sole tas battle ffa server",
                            data_uptimes: [ -1 ],
                            status: 1,
                        }
                    ]
                },
                {
                    name: "Discord Bots",
                    services: [
                        {
                            name: "TAS8999",
                            info: "Concord based discord bot for the Minecraft TAS discord community, providing various commands and features",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Findseed",
                            info: "Concord based discord bot for the Minecraft TAS discord community, bringing /findseed to discord",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Puppy",
                            info: "A cute discord bot for various roleplaying gifs and images, serenity-rs based",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Question Of The Day",
                            info: "Private discord bot",
                            data_uptimes: [ -1 ],
                            status: 1,
                        }
                    ]
                },
                {
                    name: "Other Services",
                    services: [
                        {
                            name: "Tino",
                            info: "Private software",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Apache HTTP Server",
                            info: "Web server for various services and reverse proxies",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "PostgreSQL",
                            info: "Database for various services",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Reposilite",
                            info: "Minecraft TAS java maven repository",
                            data_uptimes: [ -1 ],
                            status: 1,
                        },
                        {
                            name: "Synapse Matrix Server",
                            info: "Private matrix homeserver",
                            data_uptimes: [ -1 ],
                            status: 1,
                        }
                    ]
                },
            ]
        }
    ]
}

let refresh_timeout;

/**
 * refresh the main html element
 */
function refresh() {
    // fetch data from the api (TODO)
    const DATA = TEST_API_RESPONSE;
    // refresh main element
    document.body.innerHTML = create_body(DATA);
    // refresh after 5 seconds
    refresh_timeout = setTimeout(refresh, 5000);
}

// refresh on resize
onresize = (event) => {
    clearTimeout(refresh_timeout);
    refresh_timeout = setTimeout(refresh, 500);
};

// initial refresh
refresh();
