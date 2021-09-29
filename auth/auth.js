const jwt = require("jsonwebtoken");
//const bcrypt = require("bcrypt");
function createToken({req,res}) {
    return new Promise((resolve, reject) => {
      var user = req.body
      jwt.sign(
      {
          name:user[0],
          lastname:user[1]
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" },
      (err, token) => {
          if (err) console.log(err);
          else{
              resolve({token})
          }
      }
      );
    })
}

function verifyToken(req, res, next) {
  if (req.url == "/login") {
    next();
  } else {
    if (typeof req.headers.authorization !== "undefined") {
      jwt.verify(req.headers.authorization, process.env.SECRET_KEY, (err, auth) => {
        if (err) {
          res.status(403).json({ error: "Authentication failed!" });
          return;
        }
        next();
      });
    } else {
      res.sendStatus(403);
    }
  }
}

module.exports = {
  createToken,
  verifyToken,
};