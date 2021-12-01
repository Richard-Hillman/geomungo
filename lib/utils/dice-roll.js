const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
};

const roll = (dice) => {
  let sum = 0;
  dice.forEach((die) => {
    for (let i = 0; i < die[0]; i++) {
      sum += getRandomInt(die[1]) + 1;
    }
  });
  return sum;
};

//3d6
// console.log(roll([[5, 6]]));

module.exports = roll;
