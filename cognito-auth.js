/*global AmazonCognitoIdentity, AWSCognito */

var AuthApp = window.AuthApp || {};

(function scopeWrapper() {
    const _config = {
        cognito: window.config.cognito, // Use configuration from config.js
    };

    const signinUrl = '/signin.html';
    const verifyUrl = '/verify.html';
    const dashboardUrl = '/index.html';

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
     * Cognito User Pool Functions
     */
    function register(email, password, name, onSuccess, onFailure) {
        const attributeList = [];
        const dataEmail = {
            Name: 'email',
            Value: email,
        };
        const dataName = {
            Name: 'name',
            Value: name,
        };
        const attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
        const attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);

        attributeList.push(attributeEmail);
        attributeList.push(attributeName);

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
        const registerForm = document.getElementById("registerForm");
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

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const password2 = document.getElementById("confirmPassword").value;

        if (password !== password2) {
            alert("Passwords do not match.");
            return;
        }

        register(
            email,
            password,
            name,
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

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        signin(
            email,
            password,
            function signinSuccess() {
                console.log("Successfully logged in.");
                alert("Login successful!");
                window.location.href = dashboardUrl; // Redirect after login
            },
            function signinFailure(err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }

    function handleVerify(event) {
        event.preventDefault();

        const email = document.getElementById("emailInputVerify").value.trim();
        const code = document.getElementById("codeInputVerify").value.trim();

        verify(
            email,
            code,
            function verifySuccess() {
                console.log("Verification successful.");
                alert("Your account has been successfully verified! Redirecting to login page.");
                window.location.href = signinUrl;
            },
            function verifyFailure(err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }
})();
