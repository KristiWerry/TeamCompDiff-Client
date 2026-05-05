import React from "react";
import { Authenticator, Button, defaultDarkModeOverride, Heading, Theme, ThemeProvider, useAuthenticator, useTheme, View } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId:
        process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || "",
    },
  },
});

const formFields = {
  signIn: {
    username: {
      placeholder: 'Enter your email',
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: "Enter Email",
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
  SignUp: {
    Header() {
      const { tokens } = useTheme();

      return (
        <Heading
          padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
          level={3}
        >
          Create a new account
        </Heading>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();

      return (
        <View textAlign="center">
          <Button
            fontWeight="normal"
            onClick={toSignIn}
            size="small"
            variation="link"
          >
            Back to Sign In
          </Button>
        </View>
      );
    },
  },
}

// TODO: styling
// docs: https://ui.docs.amplify.aws/react/theming/dark-mode
const AuthProvider = ({ children }: any) => {
  const { tokens } = useTheme();
  const theme: Theme = {
    name: 'Auth Example Theme',
    overrides: [defaultDarkModeOverride],
    tokens: {
      components: {
        authenticator: {
          router: {
            boxShadow: `0 0 16px ${tokens.colors.overlay['10']}`,
            borderWidth: '0',
          },
          form: {
            padding: `${tokens.space.medium} ${tokens.space.xl} ${tokens.space.medium}`,
          },
        },
        button: {
          primary: {
            backgroundColor: tokens.colors.neutral['100'],
          },
          link: {
            color: tokens.colors.purple['80'],
          },
        },
        fieldcontrol: {
          _focus: {
            boxShadow: `0 0 0 2px ${tokens.colors.purple['60']}`,
          },
        },
        tabs: {
          item: {
            color: tokens.colors.neutral['80'],
            _active: {
              borderColor: tokens.colors.neutral['100'],
              color: tokens.colors.purple['100'],
            },
          },
        },
      },
    },
  };

  return (
    // <div>
    <ThemeProvider theme={theme} colorMode="system">
      <Authenticator formFields={formFields} components={components}>
        {({ user }: any) =>
          user ? (
            <div>{children}</div>
          ) : (
            <div>
              <h1>Please sign in below:</h1>
            </div>
          )
        }
      </Authenticator>
    </ThemeProvider>

    // </div>
  );
};

export default AuthProvider;