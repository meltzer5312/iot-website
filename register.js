document.addEventListener("DOMContentLoaded", () => {
    // Load Cognito configuration
    const cognitoConfig = window.config.cognito;

    // Check if using Amazon Cognito Identity SDK via CDN
    const AmazonCognitoIdentity = window.AmazonCognitoIdentity;

    // Get form and input elements
    const registerForm = document.getElementById("registerForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    // Handle form submission
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent form from reloading

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Basic validation
        if (!email || !password) {
            displayError("All fields are required.");
            return;
        }
        if (password.length < 6) {
            displayError("Password must be at least 6 characters long.");
            return;
        }

        // Define Cognito User Pool
        const userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: cognitoConfig.userPoolId,
            ClientId: cognitoConfig.userPoolClientId,
        });

        // Register the user
        userPool.signUp(email, password, [], null, (err, result) => {
            if (err) {
                console.error("Error registering user:", err.message);
                displayError(err.message);
                return;
            }

            console.log("User registered successfully:", result.user.getUsername());
            alert("Registration successful! Please confirm your email.");
            registerForm.reset(); // Clear the form
        });
    });

    // Helper function to display error messages
    function displayError(message) {
        errorMessage.textContent = message;
    }
});
