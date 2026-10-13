import { ContentApplyService } from './content-apply.service';
import type { ProductContent } from './product-content';

describe('ContentApplyService image replacement', () => {
  const images = [
    {
      id: 'admin',
      sourceUrl: null,
      objectKey: 'a',
      thumbnailKey: 'at',
      isPrimary: false,
      sortOrder: 1,
    },
    {
      id: 'old',
      sourceUrl: 'file:110930007-1.jpg',
      objectKey: 'o',
      thumbnailKey: 'ot',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      id: 'kept',
      sourceUrl: 'file:110930007-shop-1.jpg',
      objectKey: 'k',
      thumbnailKey: 'kt',
      isPrimary: false,
      sortOrder: 2,
    },
  ];

  function setup() {
    const repo = {
      findBy: jest
        .fn()
        .mockResolvedValue(images.map((image) => ({ ...image }))),
      remove: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value: unknown) => value),
    };
    const imageService = {
      deleteProductImage: jest.fn().mockResolvedValue(undefined),
      uploadProductImage: jest.fn(),
    };
    const service = new ContentApplyService(
      { getRepository: () => repo } as never,
      imageService as never,
      {} as never,
      {} as never,
    );
    return { service, repo, imageService };
  }

  const content = (replaceImages?: boolean) =>
    ({
      images: [{ file: 'content/photos/x/110930007-shop-1.jpg', alt: 'x' }],
      replaceImages,
    }) as unknown as ProductContent;

  const result = () => ({
    slug: 's',
    messages: [],
    imagesAdded: 0,
    imagesRemoved: 0,
  });

  it('removes only imported images missing from the file', async () => {
    const { service, repo, imageService } = setup();
    const res = result();
    await (service as any).applyImages(
      { id: 'p' },
      content(true),
      '/repo',
      res,
    );

    expect(repo.remove).toHaveBeenCalledTimes(1);
    expect(repo.remove.mock.calls[0][0].id).toBe('old');
    expect(imageService.deleteProductImage).toHaveBeenCalledWith('o', 'ot');
    expect(res.imagesRemoved).toBe(1);
    expect(imageService.uploadProductImage).not.toHaveBeenCalled();
  });

  it('keeps everything without the flag', async () => {
    const { service, repo } = setup();
    const res = result();
    await (service as any).applyImages({ id: 'p' }, content(), '/repo', res);
    expect(repo.remove).not.toHaveBeenCalled();
    expect(res.imagesRemoved).toBe(0);
  });
});
