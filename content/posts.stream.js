const posts_stream = {
    'e003': {
        tags: ['003 - Salt Lake City, UT'],
        title: 'Meth-Head Conservatory, Wildlife Refuge, and Viewing Area',
        short: '003 - Salt Lake City, UT',
        image: 'images/post_images/003/salt-lake-city.jpg',
        thumbnail: 'images/avatars/cover.jpg',
        date: {
            display: 'September 7, 2019',
            short: 'Sept 7, 2019',
            numeric: '2019-09-07',
        },
        action: {
            text: 'Listen Now',
            link: 'https://open.spotify.com/episode/7xsXyKLXrvUmKNuqh3g1c3',
        },
    },
    'e002': {
        tags: ['002 - Providence, RI'],
        title: 'Ignorant Meat Tanks',
        short: '002 - Providence, RI',
        image: 'images/post_images/002/rhode_island.jpg',
        thumbnail: 'images/avatars/cover.jpg',
        date: {
            display: 'August 17, 2019',
            short: 'Aug 17, 2019',
            numeric: '2019-08-17',
        },
        action: {
            text: 'Listen Now',
            link: 'https://open.spotify.com/episode/3AMemdxcQAhAT92LM0rJq8',
        },
    },
    'e001': {
        tags: ['001 - Omaha, NE'],
        title: 'Search for the Jumbo-Mallows',
        short: '001 - Omaha, NE',
        image: 'images/post_images/001/buffett.jpg',
        thumbnail: 'images/avatars/cover.jpg',
        date: {
            display: 'July 29, 2019',
            short: 'Jul 29, 2019',
            numeric: '2019-07-29',
        },
        action: {
            text: 'Listen Now',
            link: 'https://open.spotify.com/episode/5BzN1DOISM92E9swOE7iRQ',
        },
    },
}

cms.stream.register('posts', posts_stream)
cms.stream.index('post_tags', cms.stream.accrue('posts', 'tags'))