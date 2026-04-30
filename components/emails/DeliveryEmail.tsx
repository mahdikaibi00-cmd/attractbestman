import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface DeliveryEmailProps {
  customerName: string;
}

export const DeliveryEmail = ({
  customerName = "There",
}: DeliveryEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Access: The Pattern You Never Saw</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={brandText}>ATTRACT BEST MAN</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={title}>The blindfold is off.</Heading>
            
            <Text style={text}>
              Hi {customerName},
            </Text>
            
            <Text style={text}>
              Your purchase is complete. Welcome to the other side. 
            </Text>

            <Text style={text}>
              Remember the rule before you open this: Read one chapter at a time. Do not rush to the scripts. Your nervous system needs time to regulate the truth.
            </Text>

            <Section style={attachmentBox}>
              <Text style={attachmentBoxTitle}>
                Your ebook is attached to this email.
              </Text>
              <Text style={attachmentBoxSub}>
                Please download and save the PDF to your files or iBooks immediately.
              </Text>
            </Section>

            <Text style={signOff}>
              Stay grounded,<br />
              The ABM Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Attract Best Man. All rights reserved.
            </Text>
            <Text style={footerText}>
              If you have any issues with your attachment, reply directly to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DeliveryEmail;

// --- STYLES ---

const main = {
  backgroundColor: "#FDF8F9",
  fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'",
};

const container = {
  margin: "40px auto",
  backgroundColor: "#ffffff",
  border: "1px solid #fce7f3",
  borderRadius: "24px",
  overflow: "hidden",
  maxWidth: "600px",
  boxShadow: "0 20px 50px rgba(244,63,94,0.05)",
};

const header = {
  backgroundColor: "#1D1D1F",
  padding: "32px 0",
  textAlign: "center" as const,
};

const brandText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "800",
  letterSpacing: "4px",
  margin: "0",
};

const content = {
  padding: "48px 40px",
};

const title = {
  color: "#1D1D1F",
  fontSize: "32px",
  fontWeight: "800",
  margin: "0 0 24px",
  letterSpacing: "-1px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 20px",
  fontWeight: "500",
};

const attachmentBox = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#FDF8F9",
  borderRadius: "16px",
  border: "1px solid #fce7f3",
  textAlign: "center" as const,
};

const attachmentBoxTitle = {
  color: "#e11d48",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const attachmentBoxSub = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "0",
};

const signOff = {
  color: "#1D1D1F",
  fontSize: "16px",
  fontWeight: "bold",
  lineHeight: "24px",
  margin: "0",
};

const footer = {
  backgroundColor: "#FFF5F7",
  padding: "32px 40px",
  textAlign: "center" as const,
  borderTop: "1px solid #fce7f3",
};

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 8px",
  fontWeight: "600",
};