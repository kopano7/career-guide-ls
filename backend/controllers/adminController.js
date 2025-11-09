// backend/controllers/adminController.js - UPDATED VERSION
const { db } = require('../config/firebase');
const { successResponse, errorResponse } = require('../utils/helpers');

// Get all users with filtering
const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    let query = db.collection('users');

    if (role) query = query.where('role', '==', role);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const users = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    res.json(successResponse({ users }, 'Users retrieved successfully'));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json(errorResponse('Failed to get users', error.message));
  }
};

// Approve institute/company
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const user = userDoc.data();
    
    // Only allow approving institutes and companies
    if (user.role !== 'institute' && user.role !== 'company') {
      return res.status(400).json(errorResponse('Only institute and company accounts can be approved'));
    }

    await db.collection('users').doc(userId).update({
      status: 'approved',
      approvedAt: new Date(),
      updatedAt: new Date()
    });

    res.json(successResponse(null, 'User approved successfully'));
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json(errorResponse('Failed to approve user', error.message));
  }
};

// Suspend user
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    await db.collection('users').doc(userId).update({
      status: 'suspended',
      suspendedAt: new Date(),
      updatedAt: new Date()
    });

    res.json(successResponse(null, 'User suspended successfully'));
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json(errorResponse('Failed to suspend user', error.message));
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    const [studentsSnapshot, institutesSnapshot, companiesSnapshot, applicationsSnapshot, jobsSnapshot] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('users').where('role', '==', 'institute').get(),
      db.collection('users').where('role', '==', 'company').get(),
      db.collection('applications').get(),
      db.collection('jobs').get()
    ]);

    // Get pending approvals
    const pendingApprovalsSnapshot = await db.collection('users')
      .where('status', '==', 'pending')
      .where('role', 'in', ['institute', 'company'])
      .get();

    res.json(successResponse({
      stats: {
        students: studentsSnapshot.size,
        institutes: institutesSnapshot.size,
        companies: companiesSnapshot.size,
        applications: applicationsSnapshot.size,
        jobs: jobsSnapshot.size,
        pendingApprovals: pendingApprovalsSnapshot.size
      }
    }, 'System statistics retrieved successfully'));
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json(errorResponse('Failed to get system statistics', error.message));
  }
};

// ========== INSTITUTE APPROVAL FUNCTIONS ==========

// Get pending institutes - UPDATED with client-side filtering
const getPendingInstitutes = async (req, res) => {
  try {
    console.log('🔄 Fetching pending institutes (client-side filtering)...');
    
    // Simple query without composite filters to avoid index issues
    const institutesSnapshot = await db.collection('users')
      .where('role', '==', 'institute')
      .get();

    // Filter manually in code instead of in query
    const institutes = institutesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.institutionName || data.name || 'Unknown Institution',
          email: data.email,
          phoneNumber: data.phone,
          address: data.address,
          institutionType: data.institutionType,
          establishedYear: data.establishedYear,
          accreditation: data.accreditation,
          description: data.description,
          status: data.status, // Include status for filtering
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };
      })
      .filter(institute => institute.status === 'pending') // Manual filtering
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Manual sorting

    console.log(`✅ Found ${institutes.length} pending institutes (from ${institutesSnapshot.size} total)`);
    
    res.json(successResponse({ institutes }, 'Pending institutes retrieved successfully'));
  } catch (error) {
    console.error('❌ Get pending institutes error:', error);
    res.status(500).json(errorResponse('Failed to get pending institutes', error.message));
  }
};

// Approve or reject institute - UPDATED with better error handling
const approveInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { approved } = req.body;

    console.log('=== APPROVE INSTITUTE DEBUG START ===');
    console.log('📥 Request params:', req.params);
    console.log('📥 Request body:', req.body);
    console.log('👤 Request user:', req.user);
    console.log('=== APPROVE INSTITUTE DEBUG END ===');

    if (typeof approved === 'undefined') {
      return res.status(400).json(errorResponse('Approved parameter is required'));
    }

    console.log(`🔄 Processing institute approval:`, { instituteId, approved });

    // Get institute from users collection
    const instituteDoc = await db.collection('users').doc(instituteId).get();
    if (!instituteDoc.exists) {
      console.log('❌ Institute not found in users collection:', instituteId);
      return res.status(404).json(errorResponse('Institute not found'));
    }

    const instituteData = instituteDoc.data();
    const newStatus = approved ? 'approved' : 'rejected';

    console.log(`📝 Updating institute status to: ${newStatus}`);

    // Update user collection
    await db.collection('users').doc(instituteId).update({
      status: newStatus,
      approvedAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Updated users collection');

    // Update institutions collection if it exists
    try {
      const institutionDoc = await db.collection('institutions').doc(instituteId).get();
      if (institutionDoc.exists) {
        await db.collection('institutions').doc(instituteId).update({
          status: newStatus,
          approvedAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Updated institutions collection');
      } else {
        console.log('ℹ️  No institutions collection document found, creating one...');
        // Create institution document if it doesn't exist
        await db.collection('institutions').doc(instituteId).set({
          uid: instituteId,
          name: instituteData.institutionName || instituteData.name,
          email: instituteData.email,
          phone: instituteData.phone,
          address: instituteData.address,
          status: newStatus,
          approvedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Created institutions collection document');
      }
    } catch (institutionError) {
      console.warn('⚠️  Institutions collection update failed:', institutionError.message);
      // Continue even if institutions collection fails
    }

    console.log(`✅ Institute ${newStatus} successfully: ${instituteData.institutionName || instituteData.name}`);

    res.json(successResponse(
      null, 
      `Institute ${newStatus} successfully`
    ));

  } catch (error) {
    console.error('❌ Approve institute error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json(errorResponse('Failed to approve institute', error.message));
  }
};

// ========== COMPANY APPROVAL FUNCTIONS ==========

// Get pending companies - UPDATED with client-side filtering
const getPendingCompanies = async (req, res) => {
  try {
    console.log('🔄 Fetching pending companies (client-side filtering)...');
    
    // Simple query without composite filters
    const companiesSnapshot = await db.collection('users')
      .where('role', '==', 'company')
      .get();

    // Filter manually in code
    const companies = companiesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.companyName || data.name || 'Unknown Company',
          email: data.email,
          phoneNumber: data.phone,
          address: data.address,
          industry: data.industry,
          companySize: data.companySize,
          foundedYear: data.foundedYear,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };
      })
      .filter(company => company.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`✅ Found ${companies.length} pending companies (from ${companiesSnapshot.size} total)`);
    
    res.json(successResponse({ companies }, 'Pending companies retrieved successfully'));
  } catch (error) {
    console.error('❌ Get pending companies error:', error);
    res.status(500).json(errorResponse('Failed to get pending companies', error.message));
  }
};

// Approve or reject company - UPDATED with better error handling
const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { approved } = req.body;

    console.log('=== APPROVE COMPANY DEBUG START ===');
    console.log('📥 Request params:', req.params);
    console.log('📥 Request body:', req.body);
    console.log('👤 Request user:', req.user);
    console.log('=== APPROVE COMPANY DEBUG END ===');

    if (typeof approved === 'undefined') {
      return res.status(400).json(errorResponse('Approved parameter is required'));
    }

    console.log(`🔄 Processing company approval:`, { companyId, approved });

    const companyDoc = await db.collection('users').doc(companyId).get();
    if (!companyDoc.exists) {
      console.log('❌ Company not found in users collection:', companyId);
      return res.status(404).json(errorResponse('Company not found'));
    }

    const companyData = companyDoc.data();
    const newStatus = approved ? 'approved' : 'rejected';

    console.log(`📝 Updating company status to: ${newStatus}`);

    // Update user collection
    await db.collection('users').doc(companyId).update({
      status: newStatus,
      approvedAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Updated users collection');

    // Update companies collection if it exists
    try {
      const companyDataDoc = await db.collection('companies').doc(companyId).get();
      if (companyDataDoc.exists) {
        await db.collection('companies').doc(companyId).update({
          status: newStatus,
          approvedAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Updated companies collection');
      } else {
        console.log('ℹ️  No companies collection document found, creating one...');
        // Create company document if it doesn't exist
        await db.collection('companies').doc(companyId).set({
          uid: companyId,
          name: companyData.companyName || companyData.name,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          status: newStatus,
          approvedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Created companies collection document');
      }
    } catch (companyError) {
      console.warn('⚠️  Companies collection update failed:', companyError.message);
      // Continue even if companies collection fails
    }

    console.log(`✅ Company ${newStatus} successfully: ${companyData.companyName || companyData.name}`);

    res.json(successResponse(null, `Company ${newStatus} successfully`));
  } catch (error) {
    console.error('❌ Approve company error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json(errorResponse('Failed to approve company', error.message));
  }
};

// Debug endpoint for testing approvals
const debugApprove = async (req, res) => {
  try {
    console.log('=== DEBUG APPROVE REQUEST ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    console.log('=== DEBUG END ===');
    
    res.json({ 
      success: true, 
      message: 'Debug received',
      data: {
        params: req.params,
        body: req.body,
        user: req.user
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export all functions
module.exports = { 
  getUsers, 
  approveUser, 
  suspendUser, 
  getSystemStats,
  getPendingInstitutes,
  approveInstitute,
  getPendingCompanies,
  approveCompany,
  debugApprove
};