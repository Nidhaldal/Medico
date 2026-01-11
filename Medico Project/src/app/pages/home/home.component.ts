import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,                     // ⬅️ standalone component
  imports: [CommonModule, RouterLink],  // structural directives + router links
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  /* ───────────── 1. Fun-facts ───────────── */
  funFacts = [
    { icon: 'icofont icofont-home',        count: 3468, label: 'Hospital Rooms' },
    { icon: 'icofont icofont-user-alt-3',  count:  557, label: 'Specialist Doctors' },
    { icon: 'icofont-simple-smile',        count: 4379, label: 'Happy Patients'   },
    { icon: 'icofont icofont-table',       count:   32, label: 'Years of Experience' }
  ];

  /* ───────────── 2. Services grid ────────── */
  services = [
    { icon: 'icofont icofont-prescription', title: 'General Treatment',  description: 'Comprehensive outpatient and inpatient care.' },
    { icon: 'icofont icofont-tooth',        title: 'Teeth Whitening',    description: 'Brighten your smile with professional dental whitening.' },
    { icon: 'icofont icofont-heart-alt',    title: 'Heart Surgery',      description: 'Advanced cardiovascular procedures and care.' },
    { icon: 'icofont icofont-listening',    title: 'Ear Treatment',      description: 'ENT consultations and minor surgeries.' },
    { icon: 'icofont icofont-eye-alt',      title: 'Vision Problems',    description: 'Ophthalmology consultations and treatments.' },
    { icon: 'icofont icofont-blood',        title: 'Blood Transfusion',  description: 'Safe and reliable transfusion services.' }
  ];

  /* ───────────── 3. Pricing plans ────────── */
  pricingPlans = [
    {
      icon: 'icofont icofont-ui-cut',
      title: 'Plastic Surgery',
      price: 199,
      features: [
        { name: 'Consultation & Exam', included: true },
        { name: 'Customized Plan',     included: true },
        { name: 'Follow-up Visits',    included: false },
        { name: 'Post-op Therapy',     included: false },
        { name: 'Medication Coverage', included: false }
      ]
    },
    {
      icon: 'icofont icofont-tooth',
      title: 'Teeth Whitening',
      price: 299,
      features: [
        { name: 'Consultation & Exam', included: true },
        { name: 'In-Clinic Whitening', included: true },
        { name: 'Home Kit Included',   included: true },
        { name: 'Follow-up Visit',     included: false },
        { name: 'Sensitivity Care',    included: false }
      ]
    },
    {
      icon: 'icofont icofont-heart-beat',
      title: 'Heart Surgery',
      price: 399,
      features: [
        { name: 'Consultation',        included: true },
        { name: 'Surgery Fee',         included: true },
        { name: 'ICU Stay',            included: true },
        { name: 'Follow-up Visits',    included: true },
        { name: 'Rehabilitation Plan', included: true }
      ]
    }
  ];

  /* ───────────── 4. Portfolio carousel ───── */
  portfolioImages = [
    { src: 'assets/image/pf1.jpg', alt: 'Facility 1', link: '/portfolio-details' },
    { src: 'assets/image/pf2.jpg', alt: 'Facility 2', link: '/portfolio-details' },
    { src: 'assets/image/pf3.jpg', alt: 'Facility 3', link: '/portfolio-details' },
    { src: 'assets/image/pf4.jpg', alt: 'Facility 4', link: '/portfolio-details' },
    { src: 'assets/image/pf1.jpg', alt: 'Facility 5', link: '/portfolio-details' },
    { src: 'assets/image/pf2.jpg', alt: 'Facility 6', link: '/portfolio-details' },
    { src: 'assets/image/pf3.jpg', alt: 'Facility 7', link: '/portfolio-details' },
    { src: 'assets/image/pf4.jpg', alt: 'Facility 8', link: '/portfolio-details' }
  ];

  /* ───────────── 5. Blog posts ───────────── */
  blogPosts = [
    {
      img: 'assets/image/blog1.jpg',
      date: '22 Aug, 2020',
      title: 'We have announced our new product.',
      link: 'blog-single.html',
      description: 'Lorem ipsum dolor a sit ameti, consectetur adipisicing elit, sed do eiusmod tempor incididunt sed do incididunt sed.'
    },
    {
      img: 'assets/image/blog2.jpg',
      date: '15 Jul, 2020',
      title: 'Top five way for solving teeth problems.',
      link: 'blog-single.html',
      description: 'Lorem ipsum dolor a sit ameti, consectetur adipisicing elit, sed do eiusmod tempor incididunt sed do incididunt sed.'
    },
    {
      img: 'assets/image/blog3.jpg',
      date: '05 Jan, 2020',
      title: 'We provide highly business solutions.',
      link: 'blog-single.html',
      description: 'Lorem ipsum dolor a sit ameti, consectetur adipisicing elit, sed do eiusmod tempor incididunt sed do incididunt sed.'
    }
  ];

  /* ───────────── 6. Client logos ─────────── */
  clientLogos = [
    'assets/image/client1.png',
    'assets/image/client2.png',
    'assets/image/client3.png',
    'assets/image/client4.png',
    'assets/image/client5.png'
  ];

  /* ───────────── 7. Appointment dropdowns ── */
  departments = ['Department', 'Cardiac Clinic', 'Neurology', 'Dentistry', 'Gastroenterology'];
  doctors     = ['Doctor', 'Dr. Akther Hossain', 'Dr. Dery Alex', 'Dr. Jovis Karon'];

  /* ───────────── 8. Newsletter & Footer ──── */
  newsletter = {
    title: 'Sign up for newsletter',
    description: 'Cu qui soleat partiendo urbanitas. Eum aperiri indoctum eu, homero alterum.'
  };

  footer = {
    about: {
      title: 'About Us',
      description: 'Lorem ipsum dolor sit am consectetur adipisicing elit do eiusmod tempor incididunt ut labore dolore magna.',
      socials: [
        { icon: 'icofont-facebook', link: '#' },
        { icon: 'icofont-google-plus', link: '#' },
        { icon: 'icofont-twitter', link: '#' },
        { icon: 'icofont-vimeo', link: '#' },
        { icon: 'icofont-pinterest', link: '#' }
      ]
    },
    quickLinks: [
      ['Home', 'About Us', 'Services', 'Our Cases', 'Other Links'],
      ['Consuling', 'Finance', 'Testimonials', 'FAQ', 'Contact Us']
    ],
    hours: {
      title: 'Open Hours',
      description: 'Lorem ipsum dolor sit ame consectetur adipisicing elit do eiusmod tempor incididunt.',
      schedule: [
        { day: 'Monday - Friday', time: '8.00-20.00' },
        { day: 'Saturday',        time: '9.00-18.30' },
        { day: 'Monday - Thusday', time: '9.00-15.00' }
      ]
    },
    newsletter: {
      title: 'Newsletter',
      description: 'Subscribe to our newsletter to get all our news in your inbox.',
      placeholder: 'Email Address'
    },
    copyright: {
      year: 2018,
      link: 'https://www.wpthemesgrid.com',
      text: 'wpthemesgrid.com'
    }
  };

  /* ───────────── subscribe handler ───────── */
  onSubscribe(event: Event): void {
    event.preventDefault();
    alert('Thank you for subscribing!');
  }
}
