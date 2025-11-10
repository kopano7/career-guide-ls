const nodemailer = require('nodemailer');

// Email configuration with proper error handling
const createTransporter = () => {
  // Check if credentials exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials missing in .env file');
    console.log('   Please add:');
    console.log('   EMAIL_USER=jonkomanelesoetsa@gmail.com');
    console.log('   EMAIL_PASS=xlxu erob upbn gcti');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

// Verify email configuration
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration failed:', error.message);
      console.log('\n🔧 TROUBLESHOOTING GUIDE:');
      console.log('1. Go to: https://myaccount.google.com/apppasswords');
      console.log('2. Enable 2-Factor Authentication first');
      console.log('3. Generate an "App Password" for Mail (16 characters)');
      console.log('4. Use the App Password in .env, NOT your regular password');
      console.log('5. Make sure EMAIL_USER and EMAIL_PASS are in your .env file');
      console.log(`6. Current EMAIL_USER: ${process.env.EMAIL_USER}`);
      console.log(`7. Password length: ${process.env.EMAIL_PASS?.length} characters`);
    } else {
      console.log('✅ Email service is ready to send messages');
      console.log(`📧 Connected as: ${process.env.EMAIL_USER}`);
    }
  });
}

// Email templates (complete with verification template)
const emailTemplates = {
  verification: (data) => ({
    subject: 'Email Verification Code - Career Guidance Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email Address</h2>
        <p>Hello ${data.name},</p>
        <p>Thank you for registering with Career Guidance Platform. Please use the verification code below to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; display: inline-block;">
            <h1 style="margin: 0; color: #2563eb; letter-spacing: 5px; font-size: 32px;">${data.code}</h1>
          </div>
        </div>
        <p>This code will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>Career Guidance Platform Team</p>
      </div>
    `,
  }),

  welcome: (user) => ({
    subject: 'Welcome to Career Guidance Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Career Guidance Platform! 🎉</h2>
        <p>Hello ${user.name},</p>
        <p>Your account has been successfully created as a <strong>${user.role}</strong>.</p>
        ${user.role === 'institute' || user.role === 'company' ? 
          `<p>Your account is pending admin approval. You will be notified once it's approved.</p>` : 
          `<p>You can now start exploring courses and applying to institutions.</p>`
        }
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        <p>Best regards,<br>Career Guidance Platform Team</p>
      </div>
    `,
  }),

  accountApproved: (user) => ({
    subject: 'Your Account Has Been Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Account Approved!</h2>
        <p>Hello ${user.name},</p>
        <p>Great news! Your ${user.role} account has been approved by our admin team.</p>
        <p>You can now access all features of the platform.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" 
             style="background-color: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Account
          </a>
        </div>
        <p>Best regards,<br>Career Guidance Platform Team</p>
      </div>
    `,
  }),

  applicationSubmitted: (application, student, course) => ({
    subject: 'Course Application Submitted Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Submitted!</h2>
        <p>Hello ${student.name},</p>
        <p>Your application for <strong>${course.name}</strong> has been submitted successfully.</p>
        <p><strong>Application Details:</strong></p>
        <ul>
          <li>Course: ${course.name}</li>
          <li>Institution: ${course.institutionName}</li>
          <li>Applied on: ${new Date(application.appliedAt).toLocaleDateString()}</li>
          <li>Status: <span style="color: #f59e0b;">Pending</span></li>
        </ul>
        <p>You will be notified when the institution reviews your application.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/applications" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Your Applications
          </a>
        </div>
        <p>Best regards,<br>Career Guidance Platform Team</p>
      </div>
    `,
  }),

  applicationStatusUpdate: (application, student, course, newStatus) => ({
    subject: `Application Update: ${course.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${
          newStatus === 'admitted' ? '#10b981' : 
          newStatus === 'rejected' ? '#ef4444' : '#f59e0b'
        };">Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}! ${
          newStatus === 'admitted' ? '🎓' : 
          newStatus === 'rejected' ? '❌' : '⏳'
        }</h2>
        <p>Hello ${student.name},</p>
        <p>Your application for <strong>${course.name}</strong> has been <strong>${newStatus}</strong>.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Course: ${course.name}</li>
          <li>Institution: ${course.institutionName}</li>
          <li>Status: <span style="color: ${
            newStatus === 'admitted' ? '#10b981' : 
            newStatus === 'rejected' ? '#ef4444' : '#f59e0b'
          };">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></li>
          <li>Updated on: ${new Date().toLocaleDateString()}</li>
        </ul>
        ${application.notes ? `<p><strong>Notes from institution:</strong> ${application.notes}</p>` : ''}
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/applications" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Application Details
          </a>
        </div>
        <p>Best regards,<br>Career Guidance Platform Team</p>
      </div>
    `,
  }),

  jobNotification: (student, job, company) => ({
    subject: 'New Job Opportunity Matching Your Profile',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">New Job Opportunity!</h2>
        <p>Hello ${student.name},</p>
        <p>We found a job opportunity that matches your profile:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${job.title}</h3>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${company.companyName}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${job.jobType}</p>
          <p style="margin: 5px 0;"><strong>Apply before:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/jobs/${job.id}" 
             style="background-color: #8b5cf6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Job Details
          </a>
        </div>
        <p>Best regards,<br>Career Guidance Platform Team</p>
      </div>
    `,
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}" 
             style="background-color: #ef4444; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Career Guidance Platform Team</p>
      </div>
    `,
  }),
};

// Main email sending function
const sendEmail = async (to, templateName, data) => {
  try {
    if (!transporter) {
      throw new Error('Email service not configured. Please check your .env file and follow the troubleshooting guide above.');
    }

    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const emailContent = template(data);

    const mailOptions = {
      from: `"Career Guidance Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${templateName}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

// Batch email sending
const sendBulkEmail = async (recipients, templateName, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient.email, templateName, {
      ...data,
      user: recipient,
    });
    results.push({ email: recipient.email, ...result });
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates,
};