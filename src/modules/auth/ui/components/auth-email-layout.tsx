import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { type ReactNode } from "react";

type AuthEmailLayoutProps = {
  preview: string;
  heading: string;
  children: ReactNode;
  footnote: string;
};

export function AuthEmailLayout({ preview, heading, children, footnote }: AuthEmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={card}>
            <Text style={wordmark}>Drawly</Text>
            <Heading style={headingStyle}>{heading}</Heading>
            {children}
            <Hr style={divider} />
            <Text style={footnoteStyle}>{footnote}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  margin: "0",
  padding: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "40px 16px",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "12px",
  padding: "36px 32px",
};

const wordmark: React.CSSProperties = {
  color: "#171717",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
  margin: "0 0 28px",
};

const headingStyle: React.CSSProperties = {
  color: "#171717",
  fontSize: "22px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0 0 12px",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  borderWidth: "1px 0 0",
  borderStyle: "solid",
  margin: "28px 0 16px",
};

const footnoteStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};
