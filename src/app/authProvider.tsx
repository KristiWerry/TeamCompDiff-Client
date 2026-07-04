"use client";

import {
  Authenticator,
  Button,
  defaultDarkModeOverride,
  Heading,
  Theme,
  ThemeProvider,
  useAuthenticator,
  useTheme,
  View,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || "",
    },
  },
});

const formFields = {
  signIn: {
    username: {
      label: "Email",
      placeholder: "Enter your email",
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: "Enter email",
      label: "Username",
      isRequired: true,
    },
    password: {
      order: 2,
      placeholder: "Enter your password",
      label: "Password",
      isRequired: true,
    },
    confirm_password: {
      order: 3,
      placeholder: "Confirm your password",
      label: "Confirm Password",
      isRequired: true,
    },
  },
};

const components = {
  SignIn: {
    Header() {
      const { tokens } = useTheme();
      return (
        <View textAlign="center" padding={`${tokens.space.xl} ${tokens.space.xl} 0`}>
          <Heading level={3} style={{ color: "#E8E7F0", fontWeight: 700 }}>
            Team Comp Diff
          </Heading>
          <p style={{ color: "#9896A8", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Sign in to your account
          </p>
        </View>
      );
    },
  },
  SignUp: {
    Header() {
      const { tokens } = useTheme();
      return (
        <Heading padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`} level={3}>
          Create a new account
        </Heading>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View textAlign="center">
          <Button fontWeight="normal" onClick={toSignIn} size="small" variation="link">
            Back to Sign In
          </Button>
        </View>
      );
    },
  },
};

const theme: Theme = {
  name: "Team Comp Diff Dark",
  overrides: [defaultDarkModeOverride],
  tokens: {
    colors: {
      background: {
        primary: { value: "#0B0A10" },
        secondary: { value: "#13121A" },
        tertiary: { value: "#17161E" },
      },
      font: {
        primary: { value: "#E8E7F0" },
        secondary: { value: "#9896A8" },
        interactive: { value: "#8B5CF6" },
      },
      brand: {
        primary: {
          10: { value: "#1E1A2E" },
          20: { value: "#2D2350" },
          40: { value: "#4A3880" },
          60: { value: "#6D28D9" },
          80: { value: "#8B5CF6" },
          90: { value: "#A78BFA" },
          100: { value: "#E8E7F0" },
        },
      },
      border: {
        primary: { value: "#22212C" },
        secondary: { value: "#22212C" },
        focus: { value: "#8B5CF6" },
      },
    },
    components: {
      authenticator: {
        router: {
          boxShadow: { value: "none" },
          borderWidth: { value: "1px" },
          borderColor: { value: "#22212C" },
          backgroundColor: { value: "#17161E" },
        },
        form: {
          padding: { value: "1.5rem 2rem" },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: "#8B5CF6" },
          color: { value: "#FFFFFF" },
          _hover: {
            backgroundColor: { value: "#A78BFA" },
          },
          _active: {
            backgroundColor: { value: "#7C3AED" },
          },
        },
        link: {
          color: { value: "#8B5CF6" },
          _hover: {
            color: { value: "#A78BFA" },
            backgroundColor: { value: "transparent" },
          },
        },
      },
      fieldcontrol: {
        borderColor: { value: "#22212C" },
        color: { value: "#E8E7F0" },
        _focus: {
          borderColor: { value: "#8B5CF6" },
          boxShadow: { value: "0 0 0 2px rgba(139, 92, 246, 0.25)" },
        },
      },
      tabs: {
        backgroundColor: { value: "#13121A" },
        borderColor: { value: "#22212C" },
        item: {
          color: { value: "#9896A8" },
          borderColor: { value: "transparent" },
          _active: {
            color: { value: "#E8E7F0" },
            borderColor: { value: "#8B5CF6" },
            backgroundColor: { value: "#17161E" },
          },
          _hover: {
            color: { value: "#E8E7F0" },
            backgroundColor: { value: "#17161E" },
          },
          _focus: {
            color: { value: "#E8E7F0" },
          },
        },
      },
    },
  },
};

const AuthProvider = ({ children }: any) => {
  return (
    <ThemeProvider theme={theme} colorMode="dark">
      <Authenticator formFields={formFields} components={components} hideSignUp>
        {children}
      </Authenticator>
    </ThemeProvider>
  );
};

export default AuthProvider;
