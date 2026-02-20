document.addEventListener('DOMContentLoaded', event => {
    document.fonts.ready.then(() => {
        const triggerSection = document.querySelector('.scroll-through_slider') // 300vh outer
        const stickyContainer = document.querySelector('.cc-sticky')
        const contentSlides = document.querySelectorAll(
            '.vertical-slider_slide1, .vertical-slider_slide2, .vertical-slider_slide3',
        )
        const slider = document.querySelector('[data-vertical-slider]')
        const images = slider.querySelectorAll('[data-illo]')
        const dots = document.querySelectorAll('.vertical-slider_pagination > *')

        // initial states
        contentSlides.forEach((slide, index) => {
            if (index === 0) {
                gsap.set(slide, { opacity: 1, y: 0 })
            } else {
                gsap.set(slide, { opacity: 0, y: 50 })
            }
        })
        images.forEach((image, index) => {
            if (index === 0) {
                gsap.set(image, { opacity: 1 })
            } else {
                gsap.set(image, { opacity: 0 })
            }
        })
        dots.forEach((dot, index) => {
            if (index === 0) {
                dot.classList.remove('is--inactive')
            } else {
                dot.classList.add('is--inactive')
            }
        })

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.scroll-through_slider',
                pin: '.cc-sticky',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
                onUpdate: self => {
                    const timelineTime = tl.time() // Current position in timeline

                    // Dots switch AFTER content is visible (at index + 0.6 roughly)
                    let currentIndex = 0
                    if (timelineTime > 1.3) currentIndex = 1
                    if (timelineTime > 2.2) currentIndex = 2

                    dots.forEach((dot, index) => {
                        if (index === currentIndex) {
                            dot.classList.remove('is--inactive')
                        } else {
                            dot.classList.add('is--inactive')
                        }
                    })
                },
            },
        })

        // Animate content slides
        contentSlides.forEach((slide, index) => {
            if (index > 0) {
                tl.to(
                    contentSlides[index - 1],
                    {
                        opacity: 0,
                        y: -50,
                        duration: 0.4,
                    },
                    index,
                )

                tl.to(
                    slide,
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.4,
                    },
                    index + 0.4,
                )
            }
        })

        // Animate images
        images.forEach((image, index) => {
            if (index > 0) {
                tl.to(
                    images[index - 1],
                    {
                        opacity: 0,
                        duration: 0.4,
                    },
                    index,
                )
                tl.to(
                    image,
                    {
                        opacity: 1,
                        duration: 0.4,
                    },
                    index,
                )
            }
        })

        const parallaxIllo1 = () => {
            const illo = images[0]
            const layer1 = illo.querySelector('[data-illo-layer1]')
            const layer2 = illo.querySelector('[data-illo-layer2]')
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.scroll-through_slider',
                    start: 'top 75%',
                    end: '33% top',
                    scrub: 1.2,
                },
            })
            tl.fromTo(illo, { yPercent: 0 }, { yPercent: 15 }, 0)
            tl.fromTo(layer1, { yPercent: 0 }, { yPercent: 20 }, 0)
            tl.fromTo(layer2, { yPercent: 0 }, { yPercent: -50 }, 0)
        }

        const parallaxIllo2 = () => {
            const illo = images[1]
            const layer1 = illo.querySelector('[data-illo-layer1]')
            const layer2 = illo.querySelector('[data-illo-layer2]')
            const layer3 = illo.querySelector('[data-illo-layer3]')
            const layer4 = illo.querySelector('[data-illo-layer4]')
            const layer5 = illo.querySelector('[data-illo-layer5]')
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.scroll-through_slider',
                    start: '25% top',
                    end: '56% top',
                    scrub: 1.2,
                },
            })
            tl.fromTo(illo, { yPercent: 30 }, { yPercent: 65 }, 0)
            tl.fromTo(layer1, { yPercent: 0 }, { yPercent: 130 }, 0)
            tl.fromTo(layer2, { yPercent: 0 }, { yPercent: 90 }, 0)
            tl.fromTo(layer3, { yPercent: 0 }, { yPercent: 40 }, 0)
            tl.fromTo(layer4, { yPercent: 12 }, { yPercent: -80 }, 0)
            tl.fromTo(layer5, { yPercent: -70 }, { yPercent: -150 }, 0)
        }

        const parallaxIllo3 = () => {
            const illo = images[2]
            const layer1 = illo.querySelector('[data-illo-layer1]')
            const layer2 = illo.querySelector('[data-illo-layer2]')
            const layer3 = illo.querySelector('[data-illo-layer3]')
            const layer4 = illo.querySelector('[data-illo-layer4]')
            const layer5 = illo.querySelector('[data-illo-layer5]')
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.scroll-through_slider',
                    start: '50% top',
                    end: 'bottom top',
                    scrub: 1.2,
                },
            })
            gsap.set(illo, { xPercent: 30 })
            gsap.set(layer1, { yPercent: 10 })
            gsap.set(layer2, { yPercent: 18 })
            gsap.set(layer4, { xPercent: 10, yPercent: 10 })
            gsap.set(layer5, { yPercent: 10 })

            tl.fromTo(layer1, { xPercent: -26 }, { xPercent: -70 }, 0)
            tl.fromTo(layer2, { xPercent: -10, yPercent: 10 }, { xPercent: -12, yPercent: 30 }, 0)
            tl.fromTo(layer3, { yPercent: 0 }, { yPercent: -12 }, 0)
            tl.fromTo(layer5, { xPercent: 26 }, { xPercent: 50 }, 0)
        }

        parallaxIllo1()
        parallaxIllo2()
        parallaxIllo3()
    })
})
