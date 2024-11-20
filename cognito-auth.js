/*global AmazonCognitoIdentity, AWSCognito */

var AuthApp = window.AuthApp || {};

(function scopeWrapper() {
    const _config = {
        cognito: window.config.cognito, // Use configuration from config.js
    };

    const signinUrl = '/signin.html';

    const poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId,
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (!(_config.cognito.userPoolId && _config.cognito.userPoolClientId && _config.cognito.region)) {
        alert("AWS Cognito configuration is missing. Please check config.js.");
        return;
    }

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    // Sign Out Functionality
    AuthApp.signOut = function signOut() {
        const currentUser = userPool.getCurrentUser();
        if (currentUser) {
            currentUser.signOut();
            alert("Successfully signed out.");
        }
    };

    // Get Current Auth Token
    AuthApp.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        const currentUser = userPool.getCurrentUser();

        if (currentUser) {
            currentUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });

    /*
     * Cognito User Pool functions
     */
    function register(email, password, onSuccess, onFailure) {
        const attributeList = [];
        const dataEmail = {
            Name: 'email',
            Value: email,
        };
        const attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        attributeList.push(attributeEmail);

        userPool.signUp(email, password, attributeList, null, function signUpCallback(err, result) {
            if (!err) {
                onSuccess(result);
            } else {
                onFailure(err);
            }
        });
    }

    function signin(email, password, onSuccess, onFailure) {
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password,
        });

        const cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure,
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
            if (!err) {
                onSuccess(result);
            } else {
                onFailure(err);
            }
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool,
        });
    }

    /*
     *  Event Handlers
     */
    document.addEventListener("DOMContentLoaded", () => {
        const registerForm = document.getElementById("registrationForm");
        const signinForm = document.getElementById("signinForm");
        const verifyForm = document.getElementById("verifyForm");

        if (registerForm) {
            registerForm.addEventListener("submit", handleRegister);
        }

        if (signinForm) {
            signinForm.addEventListener("submit", handleSignin);
        }

        if (verifyForm) {
            verifyForm.addEventListener("submit", handleVerify);
        }
    });

    function handleRegister(event) {
        event.preventDefault();

        const email = document.getElementById("emailInputRegister").value;
        const password = document.getElementById("passwordInputRegister").value;
        const password2 = document.getElementById("password2InputRegister").value;

        if (password !== password2) {
            alert("Passwords do not match.");
            return;
        }

        register(
            email,
            password,
            function registerSuccess(result) {
                console.log("Registration successful. Please verify your email.");
                alert("Registration successful. Please check your email for a verification code.");
                window.location.href = "/verify.html";
            },
            function registerFailure(err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }

    function handleSignin(event) {
        event.preventDefault();

        const email = document.getElementById("emailInputSignin").value;
        const password = document.getElementById("passwordInputSignin").value;

        signin(
            email,
            password,
            function signinSuccess() {
                console.log("Successfully logged in.");
                alert("Login successful!");
                window.location.href = "/index.html"; // Redirect after login
            },
            function signinFailure(err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }

    function handleVerify(event) {
        event.preventDefault();

        const email = document.getElementById("emailInputVerify").value;
        const code = document.getElementById("codeInputVerify").value;

        verify(
            email,
            code,
            function verifySuccess() {
                console.log("Verification successful.");
                alert("Your account has been successfully verified! Redirecting to login page.");
                window.location.href = "/signin.html";
            },
            function verifyFailure(err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }
})();
