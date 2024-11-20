document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const emailInput = document.getElementById("email");
    const nameInput = document.getElementById("name");
    const errorMessage = document.getElementById("errorMessage");
    const registerForm = document.getElementById("registerForm");

    // AWS Cognito Configuration
    const cognitoConfig = window.config.cognito;

    const userPool = new AmazonCognitoIdentity.CognitoUserPool({
        UserPoolId: cognitoConfig.userPoolId,
        ClientId: cognitoConfig.userPoolClientId,
    });

    // Password requirement elements
    const numberRequirement = document.getElementById("numberRequirement");
    const specialCharRequirement = document.getElementById("specialCharRequirement");
    const uppercaseRequirement = document.getElementById("uppercaseRequirement");
    const lowercaseRequirement = document.getElementById("lowercaseRequirement");

    // Regular expressions for validation
    const regex = {
        number: /\d/,
        specialChar: /[!@#$%^&*(),.?":{}|<>]/,
        uppercase: /[A-Z]/,
        lowercase: /[a-z]/,
    };

    // Update password requirement validation dynamically
    passwordInput.addEventListener("input", () => {
        const password = passwordInput.value;

        toggleRequirement(numberRequirement, regex.number.test(password));
        toggleRequirement(specialCharRequirement, regex.specialChar.test(password));
        toggleRequirement(uppercaseRequirement, regex.uppercase.test(password));
        toggleRequirement(lowercaseRequirement, regex.lowercase.test(password));
    });

    if (![numberRequirement, specialCharRequirement, uppercaseRequirement, lowercaseRequirement]
    .every(req => req.classList.contains("valid"))) {
    displayError("Password does not meet all requirements.");
    return;
    }
    // Submit handler
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const email = emailInput.value.trim();
        const name = nameInput.value.trim();

        // Check if all requirements are met
        if (![numberRequirement, specialCharRequirement, uppercaseRequirement, lowercaseRequirement]
            .every(req => req.classList.contains("valid"))) {
            displayError("Password does not meet all requirements.");
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            displayError("Passwords do not match.");
            return;
        }

        // Clear error and proceed with Cognito registration
        errorMessage.textContent = "";

        // AWS Cognito User Registration
        const attributeList = [];
        const dataEmail = {
            Name: 'email',
            Value: email,
        };
        const dataName = {
            Name: 'name',
            Value: name,
        };

        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(dataName));

        userPool.signUp(email, password, attributeList, null, (err, result) => {
            if (err) {
                console.error("Error during sign-up:", err.message);
                displayError(err.message);
                return;
            }

            const cognitoUser = result.user;
            console.log("User registration successful:", cognitoUser.getUsername());
            alert("Registration successful! Please check your email for verification.");
            registerForm.reset();
        });
    });

    // Function to toggle the "valid" class
    function toggleRequirement(element, isValid) {
        if (isValid) {
            element.classList.add("valid");
        } else {
            element.classList.remove("valid");
        }
    }

    // Display error messages
    function displayError(message) {
        errorMessage.textContent = message;
    }
});
