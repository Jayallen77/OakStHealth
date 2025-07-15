// script.js

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('medicare-form');
  const endpoint = 'https://leadapi.px.com/api/lead/directpost'; // PX production endpoint

  // Show/hide condition fields for MA/MS
  const product = document.getElementById('product');
  const conditionFields = document.getElementById('condition-fields');
  function toggleConditionFields() {
    if (product.value === 'MA' || product.value === 'MS') {
      conditionFields.style.display = '';
      [
        'HighCholesterol','PulmonaryDisease','VascularDisease','AIDSHIV','KidneyDisease','Asthma','Cancer','Depression','Diabetes','HeartDisease','LiverDisease','HighBloodPressure','MentalIllness','Stroke','Alzheimer','AlcoholAbuse'
      ].forEach(id => {
        document.getElementById(id).setAttribute('required', 'required');
      });
    } else {
      conditionFields.style.display = 'none';
      [
        'HighCholesterol','PulmonaryDisease','VascularDisease','AIDSHIV','KidneyDisease','Asthma','Cancer','Depression','Diabetes','HeartDisease','LiverDisease','HighBloodPressure','MentalIllness','Stroke','Alzheimer','AlcoholAbuse'
      ].forEach(id => {
        document.getElementById(id).removeAttribute('required');
      });
    }
  }
  product.addEventListener('change', toggleConditionFields);
  toggleConditionFields();

  function showMessage(msg, isError = false) {
    let msgDiv = document.getElementById('form-message');
    if (!msgDiv) {
      msgDiv = document.createElement('div');
      msgDiv.id = 'form-message';
      form.parentNode.insertBefore(msgDiv, form);
    }
    msgDiv.textContent = msg;
    msgDiv.style.color = isError ? '#b00020' : '#2563eb';
    msgDiv.style.marginBottom = '1rem';
    msgDiv.style.fontWeight = 'bold';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    // Remove previous message
    const prevMsg = document.getElementById('form-message');
    if (prevMsg) prevMsg.remove();

    // Validation
    let valid = true;
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'email', 'zip', 'dob', 'gender', 'product', 'consent'
    ];
    if (product.value === 'MA' || product.value === 'MS') {
      requiredFields.push('maritalStatus', 'currentPolicy', 'relationship');
    }
    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && ((el.type === 'checkbox' && !el.checked) || (el.type !== 'checkbox' && !el.value))) {
        el.classList.add('input-error');
        valid = false;
      } else if (el) {
        el.classList.remove('input-error');
      }
    });
    // Email format
    const email = document.getElementById('email');
    if (email && email.value && !/^\S+@\S+\.\S+$/.test(email.value)) {
      email.classList.add('input-error');
      valid = false;
    }
    // Phone format (basic)
    const phone = document.getElementById('phone');
    if (phone && phone.value && !/^[0-9\-\(\)\s]{10,}$/.test(phone.value.replace(/\D/g, ''))) {
      phone.classList.add('input-error');
      valid = false;
    }
    // Zip code
    const zip = document.getElementById('zip');
    if (zip && zip.value && !/^\d{5}$/.test(zip.value)) {
      zip.classList.add('input-error');
      valid = false;
    }
    // DOB (must be 65+)
    const dob = document.getElementById('dob');
    if (dob && dob.value) {
      const birthDate = new Date(dob.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 65) {
        dob.classList.add('input-error');
        valid = false;
      } else {
        dob.classList.remove('input-error');
      }
    }
    if (!valid) {
      showMessage('Please fill out all required fields correctly.', true);
      return;
    }

    // Build PX API payload
    const payload = {
      ApiToken: 'YOUR_API_TOKEN', // Replace with your PX token
      Vertical: 'Medicare',
      UserAgent: navigator.userAgent,
      OriginalUrl: window.location.href,
      Source: 'Web',
      TcpaText: document.querySelector('.tcpa')?.innerText || '',
      ContactData: {
        FirstName: form.firstName.value.trim(),
        LastName: form.lastName.value.trim(),
        PhoneNumber: form.phone.value.trim(),
        EmailAddress: form.email.value.trim(),
        ZipCode: form.zip.value.trim()
      },
      Person: {
        BirthDate: form.dob.value,
        Gender: form.gender.value,
        Product: form.product.value
      }
    };
    if (product.value === 'MA' || product.value === 'MS') {
      payload.Person.MaritalStatus = form.maritalStatus.value;
      payload.Person.CurrentPolicy = form.currentPolicy.value;
      payload.Person.RelationshipToApplicant = form.relationship.value;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showMessage('Thank you! Your information has been submitted.');
        form.reset();
        toggleConditionFields();
      } else {
        showMessage('There was a problem submitting your information. Please try again.', true);
      }
    } catch (err) {
      showMessage('Network error. Please try again later.', true);
    }
  });

  // Optional: highlight error fields
  document.querySelectorAll('#medicare-form input, #medicare-form select').forEach(el => {
    el.addEventListener('input', function () {
      if (el.classList.contains('input-error')) {
        el.classList.remove('input-error');
      }
    });
  });
});

// Add minimal error style
const style = document.createElement('style');
style.innerHTML = `.input-error { border: 2px solid #b00020 !important; background: #fff0f0; }`;
document.head.appendChild(style); 