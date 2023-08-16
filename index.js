const mineflayer = require("mineflayer");
const vec3 = require("vec3");

if (process.argv.length < 4 || process.argv.length > 6) {
  console.log("Usage : node index.js <host> <port> [<name>] [<password>]");
  process.exit(1);
}

const bot = mineflayer.createBot({
  host: process.argv[2],
  port: parseInt(process.argv[3]),
  username: process.argv[4] ? process.argv[4] : "bot",
  password: process.argv[5],
});

bot.on("chat", async (username, message) => {
  if (username === bot.username) return;

  switch (message) {
    case "do-move-forward":
      bot.setControlState("forward", true);
      break;

    case "do-stop":
      doStop();
      break;

    case "start-look":
      startLook();
      break;

    case "start-look-me":
      startLook(username);
      break;

    case "stop-look":
      stopLook();
      break;

    case "start-march":
      startMarch();
      break;

    case "stop-march":
      stopMarch();
      break;

    case "loaded":
      await bot.waitForChunksToLoad();
      bot.chat("Ready!");
      break;

    case "dig":
      dig();
      break;

    case "build":
      build();
      break;

    case "equip dirt":
      equipDirt();
      break;

    case "say-items":
      sayItems();
      break;

    case "say-location":
      sayLocation();
      break;

    case "say-health":
      sayHealth();
      break;

    case "log-entities":
      console.log(JSON.stringify(bot.entities, null, 2));
      break;

    case "tp":
      bot.entity.position.x += 10;
      break;

    case "foo":
      const entities = bot.entities;
      for (const entity in entities) {
        console.log(entities[entity].type);
      }
      break;
  }
});

let lookInterval;
function startLook(username) {
  lookInterval = setInterval(() => {
    let entity;
    if (username === undefined) {
      entity = bot.nearestEntity();
    } else {
      const entities = bot.entities;
      for (const item in entities) {
        if (entities[item].username === username) {
          entity = entities[item];
        }
      }
    }
    if (entity !== null) {
      if (entity.type === "player") {
        bot.lookAt(entity.position.offset(0, 1.6, 0));
      } else {
        bot.lookAt(entity.position);
      }
    }
  }, 50);
}

function stopLook() {
  clearInterval(lookInterval);
}

let marchInterval;

function startMarch() {
  marchInterval = setInterval(() => {
    bot.setControlState("forward", true);
    setTimeout(() => {
      bot.setControlState("forward", false);
    }, 2000);
  }, 3000);
}

function stopMarch() {
  clearInterval(marchInterval);
}

function sayLocation() {
  bot.chat(bot.entity.position.toString());
}

function sayHealth() {
  bot.chat(bot.health);
}

function sayItems(items = bot.inventory.items()) {
  const output = items.map(itemToString).join(", ");
  if (output) {
    bot.chat(output);
  } else {
    bot.chat("empty");
  }
}

function doMoveForward() {
  bot.setControlState("forward", true);
}

function doStop() {
  bot.clearControlStates();
}

bot.setControlState;
function foo() {
  bot.chat(bot.blockInSight);
}

async function dig() {
  let target;

  await bot.chat(bot.entity.username.toString());

  if (bot.targetDigBlock) {
    bot.chat(`already digging ${bot.targetDigBlock.name}`);
  } else {
    target = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    if (target && bot.canDigBlock(target)) {
      bot.chat(`starting to dig ${target.name}`);
      try {
        console.log(bot.nearestEntity);
        await bot.dig(target);
        bot.chat(`finished digging ${target.name}`);
      } catch (err) {
        console.log(err.stack);
      }
    } else {
      bot.chat("cannot dig");
    }
  }
}

function build() {
  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
  const jumpY = Math.floor(bot.entity.position.y) + 1.0;
  bot.setControlState("jump", true);
  bot.on("move", placeIfHighEnough);

  let tryCount = 0;

  async function placeIfHighEnough() {
    if (bot.entity.position.y > jumpY) {
      try {
        await bot.placeBlock(referenceBlock, vec3(0, 1, 0));
        bot.setControlState("jump", false);
        bot.removeListener("move", placeIfHighEnough);
        bot.chat("Placing a block was successful");
      } catch (err) {
        tryCount++;
        if (tryCount > 10) {
          bot.chat(err.message);
          bot.setControlState("jump", false);
          bot.removeListener("move", placeIfHighEnough);
        }
      }
    }
  }
}

async function equipDirt() {
  let itemsByName;
  if (bot.supportFeature("itemsAreNotBlocks")) {
    itemsByName = "itemsByName";
  } else if (bot.supportFeature("itemsAreAlsoBlocks")) {
    itemsByName = "blocksByName";
  }
  try {
    await bot.equip(bot.registry[itemsByName].dirt.id, "hand");
    bot.chat("equipped dirt");
  } catch (err) {
    bot.chat(`unable to equip dirt: ${err.message}`);
  }
}

function itemToString(item) {
  if (item) {
    return `${item.name} x ${item.count}`;
  } else {
    return "(nothing)";
  }
}
