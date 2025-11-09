const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const { successResponse, errorResponse, isValidEmail, validatePassword } = require('../utils/helpers');
const { auth, db } = require('../config/firebase');
const { verifyToken: enhancedVerifyToken } = require('../middleware/auth');

// Generate 5-digit verification code
const generateVerificationCode = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Store verification code in Firestore
const storeVerificationCode = async (email, code) => {
  try {
    await db.collection('verification_codes').doc(email).set({
      code: code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error storing verification code:', error);
    return false;
  }
};

// Verify code from Firestore
const verifyCode = async (email, code) => {
  try {
    const codeDoc = await db.collection('verification_codes').doc(email).get();
    
    if (!codeDoc.exists) {
      return { isValid: false, error: 'No verification code found' };
    }

    const codeData = codeDoc.data();
    
    // Check if code expired
    if (new Date() > codeData.expiresAt.toDate()) {
      await db.collection('verification_codes').doc(email).delete();
      return { isValid: false, error: 'Verification code expired' };
    }

    // Check if code matches
    if (codeData.code !== code) {
      return { isValid: false, error: 'Invalid verification code' };
    }

    // Delete used code
    await db.collection('verification_codes').doc(email).delete();
    return { isValid: true };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { isValid: false, error: 'Verification failed' };
  }
};

// Send verification code email
const sendVerificationCode = async (email, name, code) => {
  try {
    const result = await sendEmail(email, 'verification', { 
      name: name,
      code: code 
    });
    return result.success;
  } catch (error) {
    console.error('Error sending verification code:', error);
    return false;
  }
};

// Step 1: Start registration - Send verification code
const startRegistration = async (req, res) => {
  console.log('🔍 Registration start request:', { ...req.body, password: '***' });

  try {
    const { email, password, role, name, institutionName, companyName, phone, address } = req.body;

    // Enhanced validation
    if (!email || !password || !role) {
      return res.status(400).json(errorResponse('Email, password, and role are required'));
    }

    if (!isValidEmail(email)) {
      return res.status(400).json(errorResponse('Please provide a valid email address'));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json(errorResponse('Password requirements not met', passwordValidation.errors));
    }

    // Role-specific validation
    if (role === 'student' && !name) {
      return res.status(400).json(errorResponse('Name is required for students'));
    }

    if (role === 'institute' && !institutionName) {
      return res.status(400).json(errorResponse('Institution name is required for institutes'));
    }

    if (role === 'company' && !companyName) {
      return res.status(400).json(errorResponse('Company name is required for companies'));
    }

    // Prevent admin registration through normal registration
    if (role === 'admin') {
      return res.status(403).json(errorResponse('Admin registration is not allowed through this endpoint'));
    }

    console.log('✅ Validation passed');

    // Check if user already exists in Firestore
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json(errorResponse('User already exists with this email'));
    }

    // Also check admins collection
    const existingAdmin = await db.collection('admins')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      return res.status(409).json(errorResponse('User already exists with this email'));
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store verification code
    const codeStored = await storeVerificationCode(email, verificationCode);
    if (!codeStored) {
      return res.status(500).json(errorResponse('Failed to generate verification code'));
    }

    // Send verification code email
    const displayName = name || institutionName || companyName;
    const emailSent = await sendVerificationCode(email, displayName, verificationCode);
    
    if (!emailSent) {
      return res.status(500).json(errorResponse('Failed to send verification code email'));
    }

    // Store registration data temporarily
    await db.collection('pending_registrations').doc(email).set({
      ...req.body,
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: new Date()
    });

    console.log('✅ Verification code sent to:', email);

    res.json(successResponse(
      { email: email },
      'Verification code sent to your email. Please check your inbox and enter the code to complete registration.'
    ));

  } catch (error) {
    console.error('💥 Registration start error:', error);
    res.status(500).json(errorResponse(
      'Registration failed', 
      process.env.NODE_ENV === 'development' ? error.message : undefined
    ));
  }
};

// Step 2: Complete registration - Verify code and create user
const completeRegistration = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json(errorResponse('Email and verification code are required'));
    }

    console.log('🔐 Verifying code for:', email);

    // Verify the code
    const verificationResult = await verifyCode(email, code);
    if (!verificationResult.isValid) {
      return res.status(400).json(errorResponse(verificationResult.error));
    }

    // Get pending registration data
    const pendingRegDoc = await db.collection('pending_registrations').doc(email).get();
    if (!pendingRegDoc.exists) {
      return res.status(400).json(errorResponse('Registration data not found. Please start registration again.'));
    }

    const pendingData = pendingRegDoc.data();
    const { passwordHash, ...userData } = pendingData;

    console.log('📝 Creating user in Firestore:', email);

    // Create user data for Firestore
    const finalUserData = {
      ...userData,
      email: email.toLowerCase().trim(),
      passwordHash: passwordHash,
      status: userData.role === 'student' ? 'active' : 'pending',
      isEmailVerified: true,
      lastLoginAt: null,
      emailNotifications: true,
      smsNotifications: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      warnings: [],
      warningCount: 0
    };

    // ✅ CREATE USER IN FIRESTORE
    const user = await User.create(finalUserData);

    console.log('✅ User created successfully in Firestore with ID:', user.id);

    // Also create role-specific document if needed
    if (userData.role === 'institute') {
      await db.collection('institutions').doc(user.id).set({
        uid: user.id,
        name: userData.institutionName.trim(),
        email: email.toLowerCase().trim(),
        phone: userData.phone ? userData.phone.trim() : '',
        address: userData.address ? userData.address.trim() : '',
        status: 'pending',
        warnings: [],
        warningCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (userData.role === 'company') {
      await db.collection('companies').doc(user.id).set({
        uid: user.id,
        name: userData.companyName.trim(),
        email: email.toLowerCase().trim(),
        phone: userData.phone ? userData.phone.trim() : '',
        address: userData.address ? userData.address.trim() : '',
        status: 'pending',
        warnings: [],
        warningCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Clean up pending registration
    await db.collection('pending_registrations').doc(email).delete();

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role,
          collection: 'users'
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        { expiresIn: '7d' }
      );
      console.log('✅ JWT token generated for registration');
    } catch (tokenError) {
      console.error('❌ JWT token failed:', tokenError.message);
      token = `token-${user.id}-${Date.now()}`;
    }

    // Send welcome email (async)
    sendEmail(email, 'welcome', user)
      .then(result => {
        if (result.success) {
          console.log('✅ Welcome email sent successfully');
        } else {
          console.log('⚠️ Email delivery failed:', result.error);
        }
      })
      .catch(emailError => {
        console.log('⚠️ Email service error:', emailError.message);
      });

    // SUCCESS RESPONSE
    res.status(201).json(successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          status: user.status,
          institutionName: user.institutionName,
          companyName: user.companyName,
          phone: user.phone,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          warnings: user.warnings || [],
          warningCount: user.warningCount || 0,
          requiresApproval: ['institute', 'company'].includes(userData.role)
        },
        token: token,
        requiresApproval: ['institute', 'company'].includes(userData.role)
      },
      userData.role === 'student' 
        ? 'Registration successful! You can now login.' 
        : 'Registration submitted! Your account is pending admin approval.'
    ));

  } catch (error) {
    console.error('💥 Registration completion error:', error);
    res.status(500).json(errorResponse(
      'Registration completion failed', 
      process.env.NODE_ENV === 'development' ? error.message : undefined
    ));
  }
};

// FIXED login user function with JWT tokens
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    let user = null;
    let userCollection = 'users';

    // 1. Check admins collection first
    console.log('🔍 Checking admins collection first...');
    const adminSnapshot = await db.collection('admins')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      const adminData = adminDoc.data();
      user = {
        id: adminDoc.id,
        ...adminData,
        collection: 'admins'
      };
      userCollection = 'admins';
      console.log('✅ User found in admins collection');
    } else {
      // 2. Check users collection
      console.log('🔍 Checking users collection...');
      const userSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        user = {
          id: userDoc.id,
          ...userData,
          collection: 'users'
        };
        console.log('✅ User found in users collection');
      }
    }
    
    if (!user) {
      console.log('❌ User not found in any collection');
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    // 3. Verify password
    console.log('🔐 Verifying password...');
    if (!user.passwordHash) {
      console.log('❌ No password hash found');
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔐 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    // 4. Check user status
    if (user.status === 'suspended') {
      return res.status(403).json(errorResponse('Account suspended. Please contact administrator.'));
    }

    if (user.warningCount >= 3) {
      return res.status(403).json(errorResponse('Account suspended due to rule violations.'));
    }

    // For institutes/companies, check if approved
    if (userCollection === 'users' && (user.role === 'institute' || user.role === 'company') && user.status !== 'approved') {
      return res.status(403).json(errorResponse('Account pending admin approval.'));
    }

    console.log('✅ User authenticated:', user.email);
    console.log('📁 Collection:', userCollection);

    // 5. Update last login
    await db.collection(userCollection).doc(user.id).update({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    // 6. Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role,
          collection: userCollection
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        { expiresIn: '7d' }
      );
      console.log('✅ JWT token generated');
    } catch (tokenError) {
      console.error('❌ JWT token failed, using fallback:', tokenError.message);
      token = `token-${user.id}-${Date.now()}`;
    }

    // 7. Prepare response (remove sensitive data)
    const { passwordHash, ...safeUserData } = user;
    
    const responseData = {
      user: safeUserData,
      token: token
    };

    console.log('✅ Login successful for:', user.email);
    
    res.json({
      success: true,
      data: responseData,
      message: `Welcome back, ${user.name || user.email}!`
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json(errorResponse('Login failed. Please try again.'));
  }
};

// Resend verification code
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse('Email is required'));
    }

    if (!isValidEmail(email)) {
      return res.status(400).json(errorResponse('Please provide a valid email address'));
    }

    // Check if pending registration exists
    const pendingRegDoc = await db.collection('pending_registrations').doc(email).get();
    if (!pendingRegDoc.exists) {
      return res.status(400).json(errorResponse('No pending registration found for this email'));
    }

    const pendingData = pendingRegDoc.data();
    const displayName = pendingData.name || pendingData.institutionName || pendingData.companyName;

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    
    // Store new verification code
    const codeStored = await storeVerificationCode(email, verificationCode);
    if (!codeStored) {
      return res.status(500).json(errorResponse('Failed to generate verification code'));
    }

    // Send verification code email
    const emailSent = await sendVerificationCode(email, displayName, verificationCode);
    
    if (!emailSent) {
      return res.status(500).json(errorResponse('Failed to send verification code email'));
    }

    console.log('✅ Verification code resent to:', email);

    res.json(successResponse(
      { email: email },
      'Verification code has been resent to your email.'
    ));

  } catch (error) {
    console.error('💥 Resend verification code error:', error);
    res.status(500).json(errorResponse('Failed to resend verification code'));
  }
};

// Get user profile from correct collection
const getUserProfile = async (req, res) => {
  try {
    const { uid, collection } = req.user;

    if (!uid) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    let user = null;
    let userStats = {};

    // Get user data from correct collection
    if (collection === 'admins') {
      const adminDoc = await db.collection('admins').doc(uid).get();
      if (!adminDoc.exists) {
        return res.status(404).json(errorResponse('User not found'));
      }
      user = { id: adminDoc.id, ...adminDoc.data(), collection: 'admins' };
      
      // Admin-specific stats
      const [usersCount, coursesCount, applicationsCount, jobsCount] = await Promise.all([
        db.collection('users').get(),
        db.collection('courses').get(),
        db.collection('applications').get(),
        db.collection('jobs').get()
      ]);

      const pendingApprovals = (await db.collection('users')
        .where('status', '==', 'pending')
        .where('role', 'in', ['institute', 'company'])
        .get()).size;

      userStats = {
        totalUsers: usersCount.size,
        pendingApprovals: pendingApprovals,
        totalApplications: applicationsCount.size,
        totalJobs: jobsCount.size,
        totalCourses: coursesCount.size
      };
    } else {
      // Get from users collection
      user = await User.findById(uid);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }
      userStats = await user.getStats();
      user.collection = 'users';
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
      institutionName: user.institutionName,
      companyName: user.companyName,
      phone: user.phone,
      address: user.address,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      collection: user.collection,
      warnings: user.warnings || [],
      warningCount: user.warningCount || 0
    };

    // Add admin-specific fields
    if (user.collection === 'admins' && user.permissions) {
      userResponse.permissions = user.permissions;
    }

    res.json(successResponse(
      { 
        user: userResponse,
        stats: userStats
      },
      'Profile retrieved successfully'
    ));

  } catch (error) {
    console.error('💥 Profile error:', error);
    res.status(500).json(errorResponse('Failed to get profile'));
  }
};

// Update user profile in correct collection
const updateProfile = async (req, res) => {
  try {
    const { uid, collection } = req.user;
    const updateData = req.body;

    if (!uid) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    // Validate update data
    const allowedFields = ['name', 'phone', 'address', 'profileImage', 'emailNotifications', 'smsNotifications'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json(errorResponse('No valid fields to update'));
    }

    let updatedUser = null;

    if (collection === 'admins') {
      // Update in admins collection
      await db.collection('admins').doc(uid).update({
        ...filteredData,
        updatedAt: new Date()
      });

      const adminDoc = await db.collection('admins').doc(uid).get();
      updatedUser = { id: adminDoc.id, ...adminDoc.data(), collection: 'admins' };
    } else {
      // Update in users collection
      const user = await User.findById(uid);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      updatedUser = await user.update(filteredData);
      updatedUser.collection = 'users';

      // Also update role-specific collections if needed
      if (user.role === 'institute' && (filteredData.name || filteredData.phone || filteredData.address)) {
        await db.collection('institutions').doc(uid).update({
          ...(filteredData.name && { name: filteredData.name }),
          ...(filteredData.phone && { phone: filteredData.phone }),
          ...(filteredData.address && { address: filteredData.address }),
          updatedAt: new Date()
        });
      } else if (user.role === 'company' && (filteredData.name || filteredData.phone || filteredData.address)) {
        await db.collection('companies').doc(uid).update({
          ...(filteredData.name && { name: filteredData.name }),
          ...(filteredData.phone && { phone: filteredData.phone }),
          ...(filteredData.address && { address: filteredData.address }),
          updatedAt: new Date()
        });
      }
    }

    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
      status: updatedUser.status,
      institutionName: updatedUser.institutionName,
      companyName: updatedUser.companyName,
      phone: updatedUser.phone,
      address: updatedUser.address,
      profileImage: updatedUser.profileImage,
      isEmailVerified: updatedUser.isEmailVerified,
      emailNotifications: updatedUser.emailNotifications,
      smsNotifications: updatedUser.smsNotifications,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      collection: updatedUser.collection,
      warnings: updatedUser.warnings || [],
      warningCount: updatedUser.warningCount || 0
    };

    // Add admin-specific fields
    if (updatedUser.collection === 'admins' && updatedUser.permissions) {
      userResponse.permissions = updatedUser.permissions;
    }

    res.json(successResponse(
      { user: userResponse },
      'Profile updated successfully'
    ));

  } catch (error) {
    console.error('💥 Update profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile'));
  }
};

// Request password reset (works for both collections)
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse('Email is required'));
    }

    if (!isValidEmail(email)) {
      return res.status(400).json(errorResponse('Please provide a valid email address'));
    }

    let user = null;
    let collection = 'users';

    // Check both collections
    const adminSnapshot = await db.collection('admins')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      user = { id: adminDoc.id, ...adminDoc.data() };
      collection = 'admins';
    } else {
      user = await User.findByEmail(email);
    }

    // For security, return success even if user doesn't exist
    if (!user) {
      console.log('⚠️ Password reset request for non-existent user:', email);
      return res.json(successResponse(
        null,
        'If an account with that email exists, a password reset link has been sent.'
      ));
    }

    // Generate reset token
    const resetToken = `reset-${user.id}-${Date.now()}`;
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Store reset token in user document
    if (collection === 'admins') {
      await db.collection('admins').doc(user.id).update({
        resetToken: resetToken,
        resetTokenExpires: new Date(Date.now() + 3600000) // 1 hour
      });
    } else {
      await user.setResetToken(resetToken, 1); // 1 hour expiration
    }

    // Send password reset email
    sendEmail(email, 'passwordReset', { 
      resetLink,
      user: user
    })
      .then(result => {
        if (result.success) {
          console.log('✅ Password reset email sent to:', email);
        } else {
          console.log('⚠️ Password reset email failed:', result.error);
        }
      })
      .catch(emailError => {
        console.log('⚠️ Password reset email service error:', emailError.message);
      });

    res.json(successResponse(
      null,
      'If an account with that email exists, a password reset link has been sent.'
    ));

  } catch (error) {
    console.error('💥 Password reset error:', error);
    res.status(500).json(errorResponse('Failed to process password reset request'));
  }
};

// Reset password with token (works for both collections)
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(errorResponse('Token and new password are required'));
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json(errorResponse('Password requirements not met', passwordValidation.errors));
    }

    let user = null;
    let collection = 'users';

    // Find user by reset token in both collections
    const adminSnapshot = await db.collection('admins')
      .where('resetToken', '==', token)
      .where('resetTokenExpires', '>', new Date())
      .limit(1)
      .get();

    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      user = { id: adminDoc.id, ...adminDoc.data() };
      collection = 'admins';
    } else {
      // Check users collection
      const usersSnapshot = await db.collection('users')
        .where('resetToken', '==', token)
        .where('resetTokenExpires', '>', new Date())
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        return res.status(400).json(errorResponse('Invalid or expired reset token'));
      }

      const userDoc = usersSnapshot.docs[0];
      user = new User({ id: userDoc.id, ...userDoc.data() });
    }

    if (!user) {
      return res.status(400).json(errorResponse('Invalid or expired reset token'));
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    if (collection === 'admins') {
      await db.collection('admins').doc(user.id).update({
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date()
      });
    } else {
      await user.update({
        passwordHash: newPasswordHash
      });
      await user.clearResetToken();
    }

    res.json(successResponse(
      null,
      'Password reset successfully. You can now login with your new password.'
    ));

  } catch (error) {
    console.error('💥 Reset password error:', error);
    res.status(500).json(errorResponse('Failed to reset password'));
  }
};

// Get user statistics (for dashboard) - Enhanced for both collections
const getUserStats = async (req, res) => {
  try {
    const { uid, collection } = req.user;

    if (!uid) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    let userStats = {};

    if (collection === 'admins') {
      // Admin-specific stats
      const [usersCount, coursesCount, applicationsCount, jobsCount] = await Promise.all([
        db.collection('users').get(),
        db.collection('courses').get(),
        db.collection('applications').get(),
        db.collection('jobs').get()
      ]);

      const pendingApprovals = (await db.collection('users')
        .where('status', '==', 'pending')
        .where('role', 'in', ['institute', 'company'])
        .get()).size;

      userStats = {
        totalUsers: usersCount.size,
        pendingApprovals: pendingApprovals,
        totalApplications: applicationsCount.size,
        totalJobs: jobsCount.size,
        totalCourses: coursesCount.size
      };
    } else {
      // Regular user stats
      const user = await User.findById(uid);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      userStats = await user.getStats();
    }

    res.json(successResponse(
      { stats: userStats },
      'Statistics retrieved successfully'
    ));

  } catch (error) {
    console.error('💥 Stats error:', error);
    res.status(500).json(errorResponse('Failed to get statistics'));
  }
};

// Verify email endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(errorResponse('Verification token is required'));
    }

    // TODO: Implement email verification logic for both collections
    // For now, return success
    res.json(successResponse(
      null,
      'Email verified successfully'
    ));

  } catch (error) {
    console.error('💥 Email verification error:', error);
    res.status(500).json(errorResponse('Failed to verify email'));
  }
};

// FIXED: JWT token verification with proper error handling
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔐 Token verification debug:');
    console.log('   Token starts with eyJ:', token.startsWith('eyJ'));
    console.log('   Token parts:', token.split('.').length);
    console.log('   Token preview:', token.substring(0, 20) + '...');

    // Handle JWT tokens (your current tokens)
    if (token.startsWith('eyJ') && token.split('.').length === 3) {
      try {
        // FIX: Make sure JWT_SECRET is correct
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
        console.log('✅ JWT token verified for user:', decoded.userId);
        
        req.user = { 
          uid: decoded.userId,
          collection: decoded.collection,
          role: decoded.role
        };
        
        next();
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError.message);
        
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid JWT token' });
        } else if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'JWT token expired' });
        } else {
          return res.status(401).json({ error: 'JWT verification failed' });
        }
      }
    } else {
      console.log('❌ Unsupported token format');
      return res.status(401).json({ error: 'Unsupported token format' });
    }

  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Token verification failed' });
  }
};

// Temporary endpoint to set password for existing users
const setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    let user = null;
    let collection = 'users';

    // Check both collections
    const adminSnapshot = await db.collection('admins')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      user = { id: adminDoc.id, ...adminDoc.data() };
      collection = 'admins';
    } else {
      user = await User.findByEmail(email);
    }

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json(errorResponse('Password requirements not met', passwordValidation.errors));
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (collection === 'admins') {
      await db.collection('admins').doc(user.id).update({ 
        passwordHash: hashedPassword,
        updatedAt: new Date()
      });
    } else {
      await user.update({ passwordHash: hashedPassword });
    }

    res.json(successResponse(null, 'Password set successfully'));
  } catch (error) {
    console.error('💥 Set password error:', error);
    res.status(500).json(errorResponse('Failed to set password'));
  }
};

// Get all users (for admin panel) - includes both collections
const getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    
    let users = [];

    // Get users from users collection
    let query = db.collection('users');
    
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const usersSnapshot = await query.orderBy('createdAt', 'desc').get();
    const usersList = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      collection: 'users',
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    users = users.concat(usersList);

    // Get admins from admins collection
    const adminsSnapshot = await db.collection('admins').get();
    const adminsList = adminsSnapshot.docs.map(doc => ({
      id: doc.id,
      collection: 'admins',
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    users = users.concat(adminsList);

    res.json(successResponse(
      { users },
      'Users retrieved successfully'
    ));
  } catch (error) {
    console.error('💥 Get users error:', error);
    res.status(500).json(errorResponse('Failed to get users'));
  }
};

// Enhanced admin approval function for institutes and companies
const approveInstituteOrCompany = async (req, res) => {
  try {
    const { userId } = req.params;
    const { uid: adminId } = req.user;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const user = userDoc.data();
    
    if (user.role !== 'institute' && user.role !== 'company') {
      return res.status(400).json(errorResponse('Only institute and company accounts can be approved'));
    }

    // Update user status
    await db.collection('users').doc(userId).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminId,
      updatedAt: new Date()
    });

    // Update role-specific collection
    if (user.role === 'institute') {
      await db.collection('institutions').doc(userId).update({
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });
    } else if (user.role === 'company') {
      await db.collection('companies').doc(userId).update({
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Send approval notification
    const { createNotification } = require('../utils/notifications');
    await createNotification(
      userId,
      'account_approved',
      '✅ Account Approved!',
      `Your ${user.role} account has been approved. You can now access all platform features.`,
      { userRole: user.role, actionUrl: '/dashboard' }
    );

    res.json(successResponse(null, `${user.role} account approved successfully`));

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json(errorResponse('Failed to approve user', error.message));
  }
};

// Get user warnings (for admin panel)
const getUserWarnings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const user = userDoc.data();
    
    res.json(successResponse(
      { 
        warnings: user.warnings || [],
        warningCount: user.warningCount || 0,
        userStatus: user.status
      },
      'User warnings retrieved successfully'
    ));

  } catch (error) {
    console.error('Get user warnings error:', error);
    res.status(500).json(errorResponse('Failed to get user warnings', error.message));
  }
};

module.exports = { 
  startRegistration,
  completeRegistration,
  resendVerificationCode,
  loginUser, 
  getUserProfile, 
  updateProfile, 
  requestPasswordReset,
  resetPassword,
  getUserStats,
  verifyEmail,
  verifyToken,
  setPassword,
  getAllUsers,
  approveInstituteOrCompany,
  getUserWarnings,
  verifyToken: enhancedVerifyToken
};