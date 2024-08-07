const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');


const User = require('../models/user');
const path = require("path");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "869c71d77be707",
        pass: "330cc9bf30ad64"
    }
});

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  const ipErrorMessage = req.session.ipErrorMessage;
  delete req.session.ipErrorMessage;
  res.render('login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: message || ipErrorMessage,
      oldInput: {
          email: "",
          password: "",
          confirmPassword: "",
          username: "",
      },
      validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
      oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
    },
      validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
    const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('login', {
        path: '/login',
        pageTitle: 'login',
        errorMessage: errors.array()[0].msg,
        oldInput: {
            email: email,
            password: password,
        },
        validationErrors: errors.array()
    });
  }
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
          return res.status(422).render('login', {
              path: '/login',
              pageTitle: 'login',
              errorMessage: 'Invalid email or password.',
              oldInput: {
                  email: email,
                  password: password,
              },
              validationErrors: []
          });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
            if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.isAdmin = user.is_admin;
            req.session.user = user;
                console.log(user.is_admin);
                if(user.is_admin){
                    return req.session.save(err => {
                        res.redirect('/admin');
                    });
                } else {
                    return req.session.save(err => {
                        res.redirect('/');
                    });
                }
          }
            return res.status(422).render('login', {
                path: 'login',
                pageTitle: 'login',
                errorMessage: 'Invalid email or password.',
                oldInput: {
                    email: email,
                    password: password,
                },
                validationErrors: []
            });
        })
        .catch(err => {
          console.log(err);
          res.redirect('login');
        });
    })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });
};
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const isAdmin = req.body.isAdmin === 'true'; // Convert string to boolean if exists
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('login', {
            path: '/login',
            pageTitle: 'login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                username: username,
                confirmPassword: req.body.confirmPassword,
                is_signup: true,
            },
            validationErrors: errors.array()
        });
    }

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                username: username,
                cart: { items: [] },
                is_admin: isAdmin // Assign isAdmin directly
            });
            return user.save();
        })
        .then(result => {
            if (isAdmin) {
                // Redirect to admin customers list if isAdmin is true
                return res.redirect('/admin/customers-list');
            }
            // Redirect to login page if isAdmin is false
            return res.redirect('/login');
        })
        .then(() => {
            return transporter.sendMail({
                to: email,
                from: 'shop@node-complete.com',
                subject: 'Գրանցումը ստացվել է!',
                html: `<h1>Դուք հաջողությամբ գրանցվել եք</h1>
                    <p>Սիրով ՝</p>
                    <svg width="150" height="85" viewBox="0 0 123 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- SVG Pathes -->
                    </svg>`
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'karine.v@yoocollab.com',
          subject: 'Գաղտանաբառի վերականգնում',
          html: `
            <h1>Սիրելի օգտատեր</h1>
            <p>Դուք գաղտանաբառը վերականգնելու հարցում եք ուղարկել</p>
            <p>Սեղմեք այս <a href="http://localhost:3000/reset/${token}"> հղման</a> վրա,  նոր գաղտնաբառ սահմանելու համար:</p>
            <p>Սիրով ՝</p>
            <svg width="150" height="85" viewBox="0 0 123 78" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M107.312 31.119L76.2545 0L61.1889 15.0656L46.1234 0L0.000488281 46.1229L31.1195 77.2419L46.1234 62.1763L61.1889 77.2419L76.2545 62.1763L91.2583 77.2419L122.377 46.1229L107.312 31.119Z" fill="#ff6b6b"/>
            <path d="M107.311 31.119L76.254 0L61.1884 15.0656L46.1229 0L0 46.1229L31.119 77.2419L46.1229 62.1763L61.1884 77.2419L76.254 62.1763L91.2578 77.2419L122.377 46.1229L107.311 31.119Z" fill="#ff6b6b"/>
            <path d="M38.6517 31.6748H44.147V50.5068H38.9605V39.7015L34.1444 47.0491H34.0827L29.2666 39.7633V50.5068H24.2036V31.6748H29.6988L34.1444 38.9606L38.6517 31.6748Z" fill="white"/>
            <path d="M45.5679 31.6748H60.6952V36.1204H50.6926V38.9606H60.6952V43.0975H50.6926V46.0612H60.6952V50.5068H45.5679V31.6748Z" fill="white"/>
            <path d="M80.0817 39.5162L75.4509 50.4449C74.4012 50.6919 73.3516 50.8771 72.1167 50.8771C66.251 50.8771 61.8672 46.8637 61.8672 41.1833V41.1215C61.8672 35.6263 66.1893 31.366 71.9932 31.366C75.2657 31.366 77.6119 32.4156 79.5877 34.0827L76.5005 37.7874C75.1422 36.676 73.8455 35.9968 71.9932 35.9968C69.2765 35.9968 67.1772 38.2813 67.1772 41.1215V41.1833C67.1772 44.2087 69.2765 46.3698 72.3019 46.3698C73.5368 46.3698 74.5247 46.1228 75.3274 45.5671V43.2826H71.6227V39.4544H80.0817V39.5162Z" fill="white"/>
            <path d="M85.5166 43.0972L87.6159 37.7254L89.7152 43.0972H85.5166ZM90.2092 31.551H85.2079L77.1812 50.5065H82.6764L84.0348 47.1723H91.2588L92.6172 50.5065H98.1742L90.2092 31.551Z" fill="white"/>
            <path d="M94.2833 32.7861C94.1599 32.9713 94.0364 33.1566 94.0364 33.3418C94.0364 33.5888 94.0981 33.774 94.2833 33.8975C94.4068 34.0827 94.6538 34.1445 94.9008 34.1445C95.1478 34.1445 95.3947 34.0827 95.5182 33.8975C95.6417 33.7123 95.7035 33.527 95.7035 33.3418C95.7035 33.0948 95.6417 32.9096 95.5182 32.7861C95.3947 32.6009 95.1478 32.5391 94.9008 32.5391C94.6538 32.5391 94.4686 32.6009 94.2833 32.7861ZM96.9383 35.1324H95.6417V34.7619C95.5182 34.9472 95.3947 35.0706 95.2095 35.1324C95.0243 35.1941 94.839 35.2559 94.6538 35.2559H94.5921H94.5303C93.9746 35.2559 93.5424 35.0706 93.2337 34.7002C92.925 34.3297 92.7397 33.8975 92.7397 33.3418C92.7397 32.8479 92.925 32.3539 93.2337 31.9834C93.5424 31.613 93.9746 31.4277 94.5303 31.4277H94.5921H94.6538C94.839 31.4277 95.0243 31.4895 95.2095 31.5512C95.3947 31.613 95.5182 31.7365 95.6417 31.86V31.5512H96.9383V35.1324Z" fill="white"/>
            <path d="M99.1 31.9834C99.2853 31.7982 99.4088 31.6747 99.594 31.5512C99.7792 31.4895 99.9644 31.4277 100.211 31.4277C100.458 31.4277 100.705 31.4895 100.891 31.613C101.076 31.7365 101.261 31.9217 101.385 32.1069C101.508 31.8599 101.693 31.7365 101.879 31.613C102.125 31.4895 102.311 31.4277 102.558 31.4277C102.99 31.4277 103.36 31.5512 103.484 31.7982C103.669 32.0452 103.731 32.4157 103.731 32.8479V35.1324H102.434V33.4036V33.2801C102.434 33.2183 102.434 33.1566 102.434 33.0948C102.434 32.9096 102.372 32.7861 102.311 32.6626C102.249 32.5391 102.125 32.4774 101.94 32.4774C101.693 32.4774 101.57 32.5391 101.446 32.7244C101.385 32.8479 101.323 33.0331 101.323 33.2183C101.323 33.2801 101.323 33.2801 101.323 33.3418V33.4653V35.1941H100.026V33.4036V33.2801C100.026 33.2183 100.026 33.1566 100.026 33.0948C100.026 32.9096 99.9644 32.7861 99.9027 32.6626C99.841 32.5391 99.6557 32.4774 99.4705 32.4774C99.2853 32.4774 99.1 32.5391 99.0383 32.6626C98.9765 32.7861 98.9148 32.9713 98.9148 33.0948C98.9148 33.1566 98.9148 33.2183 98.9148 33.2801V33.4653V35.1941H97.6182V31.5512H98.9148V31.9834H99.1Z" fill="white"/>
        </svg>
          `
        });
      })
        .catch(err => {
            const error =  new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
      .then(user => {
        let message = req.flash('error');
        if (message.length > 0) {
          message = message[0];
        } else {
          message = null;
        }
        res.render('auth/new-password', {
          path: '/new-password',
          pageTitle: 'New Password',
          errorMessage: message,
          userId: user._id.toString(),
          passwordToken: token
        });
      })
        .catch(err => {
            const error =  new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId })
      .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12)
      })
      .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();

      })
      .then( result => {
        res.redirect('/login')
      })
      .catch(err => {
          const error =  new Error(err);
          error.httpStatusCode = 500;
          return next(error);
      });


}